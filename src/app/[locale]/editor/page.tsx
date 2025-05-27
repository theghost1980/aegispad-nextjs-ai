"use client";

import { ImageSearchAndInsert } from "@/components/custom/ImageSearchAndInsert";
// import { // Eliminamos la importación del flow local de traducción
//   translateArticle,
//   TranslateArticleInput,
//   TranslateArticleOutput,
// } from "@/ai/flows/translate-article";
// import DetectedLanguageInfo from "@/components/editor-sections/DetectedLanguageInfo"; // To be re-evaluated if needed
import EditorTokenUsage from "@/components/editor-sections/EditorTokenUsage";
import { LineReviewer } from "@/components/editor-sections/LineReviewer";
import {
  MarkdownFormatType,
  MarkdownToolbar,
} from "@/components/editor-sections/MarkdownToolbar";
// import RefineCombinedFormatCard, { // To be removed
//  CombineFormatType,
// } from "@/components/editor-sections/RefineCombinedFormatCard";
// import TranslateArticleCard from "@/components/editor-sections/TranslateArticleCard"; // To be removed
// import TranslationResultView from "@/components/editor-sections/TranslationResultView"; // To be removed
import GlobalLoader from "@/components/global-loader";
import LoadingSpinner from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // Importar Popover
import {
  AVAILABLE_LANGUAGES,
  COMMENT_NOTES_BY_LOCALE,
  DEFAULT_SOURCE_LANGUAGE_CREATION,
  DEFAULT_TARGET_LANGUAGE,
  ESTIMATED_INITIAL_SESSION_TOKENS,
  FINAL_REVIEW_ARTICLE_STORAGE_KEY, // Use the consistent key
} from "@/constants/constants";
import { useHiveAuth } from "@/hooks/use-hive-auth";
import { useToast } from "@/hooks/use-toast";
import { getLocaleFromLanguageValue } from "@/utils/language";
import { splitMarkdownIntoParagraphs } from "@/utils/markdown";
import { countWords } from "@/utils/text"; // Importar countWords
import {
  Coins,
  Combine,
  Copy,
  Edit3, // Importar Coins para el botón de tokens
  Eye,
  EyeOff,
  Languages, // Icono para Deshacer
  Trash2,
  Undo2, // Icono para Deshacer
} from "lucide-react"; // Icons
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown"; // For Markdown Preview
import rehypeRaw from "rehype-raw"; // Importar rehype-raw

// Define CombineFormatType locally if RefineCombinedFormatCard is removed
export type CombineFormatType =
  | "simple"
  | "detailsTag"
  | "inline"
  | "inComments";

type InitialWorkflow = "aiCreate" | "userWrite";
type ActiveEditorAction = null | "revise" | "translate" | "combine";
type RevisionType = "full" | "selective"; // Nuevo tipo para las opciones de revisión

interface StoredArticleData {
  // For consistency with final-review page
  title: string;
  content: string;
}

export default function ArticleForgePage() {
  const t = useTranslations("ArticleForgePage");
  const tTokenUsage = useTranslations("TokenUsage");
  const router = useRouter();

  const {
    isAuthenticated: isHiveLoggedIn,
    isLoading: isLoadingHiveAuth,
    authenticatedFetch,
    userRole, // <-- Obtener el userRole desde el hook
  } = useHiveAuth();

  const [prompt, setPrompt] = useState<string>("");
  const [articleMarkdown, setArticleMarkdown] = useState<string>("");
  const [targetLanguage, setTargetLanguage] = useState<string>(
    DEFAULT_TARGET_LANGUAGE
  );
  const [sourceLanguageForCreation, setSourceLanguageForCreation] =
    useState<string>(DEFAULT_SOURCE_LANGUAGE_CREATION);
  const [generateMainImage, setGenerateMainImage] = useState<boolean>(false);

  const [currentOperationMessage, setCurrentOperationMessage] = useState<
    string | null
  >(null);
  const [translatedArticleMarkdown, setTranslatedArticleMarkdown] =
    useState<string>("");
  const [originalArticleForTranslation, setOriginalArticleForTranslation] =
    useState<string>("");

  const [articleBeforeRevision, setArticleBeforeRevision] =
    useState<string>(""); // Estado para deshacer revisión

  const [currentRequestTokens, setCurrentRequestTokens] = useState<
    number | null
  >(null);
  const [sessionTotalTokens, setSessionTotalTokens] = useState<number>(0);
  const [detailedTokenUsage, setDetailedTokenUsage] = useState<{
    text?: number;
    image?: number;
  } | null>(null);
  const [sessionTextTokensUsed, setSessionTextTokensUsed] = useState<number>(0);
  const [sessionImageTokensUsed, setSessionImageTokensUsed] =
    useState<number>(0);

  const [finalCombinedOutput, setFinalCombinedOutput] = useState<string>("");
  const [selectedCombineFormat, setSelectedCombineFormat] =
    useState<CombineFormatType>("simple");

  const [initialWorkflow, setInitialWorkflow] =
    useState<InitialWorkflow>("aiCreate");
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  // const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null); // Keep if language detection logic exists

  const [isProcessing, startProcessingTransition] = useTransition();

  const [clientLoaded, setClientLoaded] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // New UI states
  const [isPreviewExpanded, setIsPreviewExpanded] = useState<boolean>(false);
  const [activeAction, setActiveAction] = useState<ActiveEditorAction>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false); // Estado para el modal de imágenes
  const [previewLayout, setPreviewLayout] = useState<"side" | "bottom">("side"); // Nuevo estado para el layout
  const mainTextareaRef = useRef<HTMLTextAreaElement>(null); // Ref para el textarea principal
  const [selectedRevisionType, setSelectedRevisionType] =
    useState<RevisionType>("full"); // Estado para el tipo de revisión seleccionado
  const [isLineReviewerOpen, setIsLineReviewerOpen] = useState(false);
  const [revisedContentForReview, setRevisedContentForReview] =
    useState<string>("");

  const { toast } = useToast();

  const isLoading = isProcessing || isLoadingHiveAuth;

  useEffect(() => {
    setClientLoaded(true);
  }, []);

  useEffect(() => {
    if (clientLoaded && !isLoadingHiveAuth) {
      if (!isHiveLoggedIn) {
        router.push("/login");
      } else {
        // Usuario está logueado, verificar rol
        if (userRole !== "admin") {
          // Si no es admin, forzar el flujo a 'userWrite'
          // y limpiar campos relacionados con la IA.
          setInitialWorkflow("userWrite");
          setPrompt("");
          setGenerateMainImage(false);
          // Opcional: resetear sourceLanguageForCreation si solo es relevante para IA
          // setSourceLanguageForCreation(DEFAULT_SOURCE_LANGUAGE_CREATION);
        }
        // Si es admin, initialWorkflow mantiene su valor actual (default 'aiCreate' o lo que haya seleccionado)
      }
    }
  }, [
    clientLoaded,
    isLoadingHiveAuth,
    isHiveLoggedIn,
    userRole,
    router,
    setInitialWorkflow,
    setPrompt,
    setGenerateMainImage,
  ]);

  const canUseEditor = isHiveLoggedIn;

  const handleTokenUpdate = (
    tokensUsed: number,
    details?: { text?: number; image?: number }
  ) => {
    setCurrentRequestTokens(tokensUsed);
    setSessionTotalTokens((prevTotal) => prevTotal + tokensUsed);

    if (details) {
      setDetailedTokenUsage(details);
      if (details.text) {
        setSessionTextTokensUsed((prev) => prev + (details.text || 0));
      }
      if (details.image) {
        setSessionImageTokensUsed((prev) => prev + (details.image || 0));
      }
    } else {
      setSessionTextTokensUsed((prev) => prev + tokensUsed);
      setDetailedTokenUsage(null);
    }
  };

  const handleCreateArticle = async () => {
    if (userRole !== "admin") {
      toast({
        title: t("toastMessages.errorTitle"),
        description: t("toastMessages.adminActionRequired"),
        variant: "destructive",
      });
      return;
    }
    if (!prompt.trim()) {
      toast({
        title: t("toastMessages.errorTitle"),
        description: t("toastMessages.promptEmptyError"),
        variant: "destructive",
      });
      return;
    }
    setCurrentOperationMessage(
      generateMainImage
        ? t("startArticleCard.creatingArticleWithImageMessage")
        : t("startArticleCard.creatingArticleMessage")
    );
    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);
    setFinalCombinedOutput("");
    setDetectedLanguage(null);
    // let generatedImageUrl: string | null = null; // Temporalmente desactivado

    startProcessingTransition(async () => {
      try {
        // Construir el prompt mejorado
        const enhancedPrompt = `You are an expert article writer. Write an article of approximately 1000 words in ${sourceLanguageForCreation} in Markdown format based on the following prompt:\n\nPrompt: ${prompt}`;

        /////
        // --- Paso 1: Generar Imagen (si está habilitado) ---
        // if (generateMainImage) { // Lógica de generación de imagen temporalmente desactivada
        //   setCurrentOperationMessage(t("startArticleCard.generatingImageMessage"));
        //   try {
        //     const imageResponse = await authenticatedFetch(
        //       "/api/ai/generate-image",
        //       {
        //         method: "POST",
        //         headers: { "Content-Type": "application/json" },
        //         body: JSON.stringify({ prompt: prompt }),
        //       }
        //     );

        //     if (!imageResponse.ok) {
        //       const errorData = await imageResponse.json();
        //       // Lanzar un error aquí podría ser mejor para que el usuario sepa que falló
        //       // y no solo continuar. O manejarlo con un toast más específico.
        //       console.warn("Image generation failed:", errorData.message || imageResponse.status);
        //       toast({
        //         title: t("toastMessages.warningTitle"),
        //         description: t("toastMessages.imageGenerationFailedWarning", { error: errorData.message || `Status: ${imageResponse.status}` }),
        //         variant: "warning",
        //       });
        //       generatedImageUrl = null;
        //     } else {
        //       const imageData = await imageResponse.json();
        //       generatedImageUrl = imageData.imageUrl;
        //     }
        //   } catch (imageError: any) {
        //     console.error("Error calling image generation API:", imageError);
        //     toast({ title: t("toastMessages.errorTitle"), description: t("toastMessages.imageGenerationFailedError", { error: imageError.message }), variant: "destructive" });
        //     generatedImageUrl = null;
        //   }
        // }
        /////

        /////
        // --- Paso 2: Crear Artículo ---
        /////

        // Usar authenticatedFetch para la llamada a la API protegida
        const response = await authenticatedFetch("/api/ai/generate-content", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // El header de Authorization lo añade authenticatedFetch
          },
          body: JSON.stringify({
            prompt: enhancedPrompt, // Enviar el prompt mejorado
            // Nota: generateMainImage y language no se envían a esta ruta específica.
            // Si se necesitaran, la ruta del backend /api/ai/generate-content debería adaptarse.
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              `Failed to create article. Server responded with ${response.status}`
          );
        }

        const result = await response.json();
        let finalArticleMarkdown = result.generatedText;

        // --- Paso 3: Combinar Imagen y Texto (Temporalmente desactivado) ---
        // if (generatedImageUrl) {
        //   finalArticleMarkdown = `!Generated Image\n\n${finalArticleMarkdown}`;
        // }
        setArticleMarkdown(finalArticleMarkdown); // <--- ESTA LÍNEA FALTABA

        // TODO: Actualizar handleTokenUpdate si el backend devuelve uso de tokens
        // La ruta /api/ai/generate-content actualmente no devuelve el uso de tokens.
        // handleTokenUpdate(totalTokensForOperation, operationDetails);
        setTranslatedArticleMarkdown("");
        setOriginalArticleForTranslation("");
        toast({
          title: t("toastMessages.successTitle"),
          description: t("toastMessages.articleCreatedSuccess"),
        });
      } catch (error: any) {
        // Especificar 'any' o un tipo más específico para error
        console.error("Error creating article:", error);
        toast({
          title: t("toastMessages.errorTitle"),
          description: t("toastMessages.createFailedError"),
          variant: "destructive",
        });
      } finally {
        setCurrentOperationMessage(null);
      }
    });
  };

  const handleStartUserWriting = () => {
    setCurrentOperationMessage(null);
    setPrompt("");
    setArticleMarkdown(t("userWriting.startPlaceholder"));
    setSourceLanguageForCreation(DEFAULT_SOURCE_LANGUAGE_CREATION);
    setTargetLanguage(DEFAULT_TARGET_LANGUAGE);
    setTranslatedArticleMarkdown("");
    setOriginalArticleForTranslation("");
    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);
    setGenerateMainImage(false);
    setFinalCombinedOutput("");
    setSelectedCombineFormat("simple");
    setDetectedLanguage(null);
    toast({
      title: t("toastMessages.successTitle"),
      description: t("toastMessages.userWritingStartedMessage"),
    });
  };

  const handleReviseArticle = async () => {
    if (!articleMarkdown.trim()) {
      setActiveAction(null);
      toast({
        title: t("toastMessages.errorTitle"),
        description: t("toastMessages.articleEmptyError"),
        variant: "destructive",
      });
      setArticleBeforeRevision(""); // Asegurar que no haya opción de deshacer
      return;
    }
    setCurrentOperationMessage(t("editArticleCard.revisingArticleMessage"));
    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);
    setFinalCombinedOutput("");
    startProcessingTransition(async () => {
      const originalContentBeforeAI = articleMarkdown;
      try {
        // Usar authenticatedFetch para la llamada a la nueva API protegida
        const response = await authenticatedFetch(
          "/api/ai/revise-article-input",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // El header de Authorization lo añade authenticatedFetch
            },
            body: JSON.stringify({ articleContent: originalContentBeforeAI }), // Corregido: solo un stringify
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          setArticleBeforeRevision(""); // Limpiar si la revisión falla
          throw new Error(
            errorData.message ||
              `Failed to revise article. Server responded with ${response.status}`
          );
        }

        const result = await response.json();
        setArticleMarkdown(result.revisedText);
        setArticleBeforeRevision(originalContentBeforeAI);
        setActiveAction(null);
        // TODO: Actualizar handleTokenUpdate si el backend devuelve uso de tokens
        // La ruta /api/ai/revise-article-input actualmente no devuelve el uso de tokens.
        // handleTokenUpdate(result.tokenUsage.totalTokens, { // Comentado temporalmente
        // text: result.tokenUsage.totalTokens,
        // });
        // Por ahora, asumimos un uso estimado o lo dejamos sin actualizar hasta que el backend lo reporte
        // handleTokenUpdate(estimatedTokensForRevision, { // Ejemplo: usar un estimado
        //   text: result.tokenUsage.totalTokens, // Comentado hasta que el backend devuelva tokens
        // });
        setTranslatedArticleMarkdown("");
        setOriginalArticleForTranslation("");
        toast({
          title: t("toastMessages.successTitle"),
          description: t("toastMessages.articleRevisedSuccess"),
        });
      } catch (error: any) {
        console.error("Error revising article:", error);
        toast({
          title: t("toastMessages.errorTitle"),
          description: t("toastMessages.reviseFailedError"),
          // description: error.message || t("toastMessages.reviseFailedError"), // Podrías mostrar el mensaje de error de la API
          variant: "destructive",
        });
      } finally {
        setCurrentOperationMessage(null);
      }
    });
  };

  const handleTranslateArticle = async () => {
    if (!articleMarkdown.trim()) {
      toast({
        title: t("toastMessages.errorTitle"),
        description: t("toastMessages.articleEmptyError"),
        variant: "destructive",
      });
      return;
    }
    if (!targetLanguage.trim()) {
      toast({
        title: t("toastMessages.errorTitle"),
        description: t("toastMessages.targetLanguageEmptyError"),
        variant: "destructive",
      });
      return;
    }

    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);
    setFinalCombinedOutput("");
    setTranslationProgress(null);

    startProcessingTransition(async () => {
      // let totalTokensForOperation = 0; // Comentado temporalmente
      // let operationDetails = { text: 0, image: 0 }; // Comentado temporalmente
      const currentArticleContent = articleMarkdown;

      try {
        setOriginalArticleForTranslation(currentArticleContent);

        // --- Lógica de Chunking ---
        const MAX_WORDS_PER_CHUNK = 330;
        const paragraphs = splitMarkdownIntoParagraphs(currentArticleContent);
        const chunks: string[] = [];
        let currentChunk = "";
        let currentChunkWordCount = 0;

        for (const paragraph of paragraphs) {
          const paragraphWordCount = countWords(paragraph);
          if (
            currentChunkWordCount + paragraphWordCount <= MAX_WORDS_PER_CHUNK &&
            currentChunk.length + paragraph.length < 8000
          ) {
            // 8000 es un límite de caracteres conservador por chunk para evitar problemas de payload
            currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
            currentChunkWordCount += paragraphWordCount;
          } else {
            // Si el chunk actual tiene contenido, añadirlo
            if (currentChunk.trim()) {
              chunks.push(currentChunk);
            }
            // Empezar un nuevo chunk con el párrafo actual
            // Si el párrafo en sí mismo excede el límite, se enviará solo
            currentChunk = paragraph;
            currentChunkWordCount = paragraphWordCount;
          }
        }
        // Añadir el último chunk si tiene contenido
        if (currentChunk.trim()) {
          chunks.push(currentChunk);
        }

        if (chunks.length === 0 && currentArticleContent.trim()) {
          // Si el artículo no está vacío pero no se generaron chunks (ej. un solo párrafo muy largo)
          chunks.push(currentArticleContent);
        }

        let finalTranslatedText = "";
        setTranslationProgress({ current: 0, total: chunks.length });

        for (let i = 0; i < chunks.length; i++) {
          const chunkToTranslate = chunks[i];
          setCurrentOperationMessage(
            t("translateArticleCard.translatingChunkMessage", {
              current: i + 1,
              total: chunks.length,
            })
          );
          setTranslationProgress({ current: i + 1, total: chunks.length });

          const response = await authenticatedFetch(
            "/api/ai/translate-article",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                articleContent: chunkToTranslate,
                targetLanguage: targetLanguage,
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.message ||
                `Failed to translate chunk ${i + 1}. Server responded with ${
                  response.status
                }`
            );
          }
          const result = await response.json();
          finalTranslatedText +=
            (finalTranslatedText ? "\n\n" : "") + result.translatedText;
          // Aquí podrías llamar a handleTokenUpdate si tu backend devolviera el uso de tokens por chunk
        }

        setTranslatedArticleMarkdown(finalTranslatedText);

        // Construir el nuevo contenido del editor
        const combinedMarkdown = `${currentArticleContent}\n\n---\n\n## ${t(
          "translateArticleCard.translationResultTitle", // Nueva clave de traducción
          { language: targetLanguage }
        )}\n\n${finalTranslatedText}`;

        setArticleMarkdown(combinedMarkdown);
        setActiveAction(null); // Ocultar el panel de traducción
        toast({
          title: t("toastMessages.successTitle"),
          description: t("toastMessages.articleTranslatedSuccess", {
            targetLanguage,
          }),
        });
      } catch (error: any) {
        console.error("Error in translation process:", error);
        toast({
          title: t("toastMessages.errorTitle"),
          description: t("toastMessages.translateFailedError"),
          variant: "destructive",
        });
      } finally {
        setCurrentOperationMessage(null);
        setTranslationProgress(null);
      }
    });
  };

  const handleUndoRevision = () => {
    if (articleBeforeRevision) {
      setArticleMarkdown(articleBeforeRevision);
      setArticleBeforeRevision(""); // Limpiar para ocultar el botón "Deshacer"
      toast({
        title: t("toastMessages.successTitle"),
        description: t("toastMessages.revisionUndoneSuccess", {
          // Nueva clave de traducción
          defaultValue: "Revision undone successfully.",
        }),
      });
    }
  };

  const handleCombineFormat = () => {
    if (
      !originalArticleForTranslation.trim() ||
      !translatedArticleMarkdown.trim()
    ) {
      toast({
        title: t("toastMessages.errorTitle"),
        description: t("toastMessages.combineEmptyError"),
        variant: "destructive",
      });
      return;
    }
    setCurrentOperationMessage(t("refineFormatCard.generatingCombinedMessage"));
    startProcessingTransition(() => {
      let combined = "";
      const originalContent = originalArticleForTranslation;
      const translatedContent = translatedArticleMarkdown;

      if (selectedCombineFormat === "simple") {
        combined = `${originalContent}\n\n<hr />\n\n## Translation (${targetLanguage})\n\n${translatedContent}`;
      } else if (selectedCombineFormat === "detailsTag") {
        combined = `${originalContent}\n\n<details>\n  <summary>Translation (${targetLanguage})</summary>\n\n${translatedContent}\n</details>`;
      } else if (selectedCombineFormat === "inline") {
        const originalParagraphs = splitMarkdownIntoParagraphs(originalContent);
        const translatedParagraphs =
          splitMarkdownIntoParagraphs(translatedContent);

        const maxLength = Math.max(
          originalParagraphs.length,
          translatedParagraphs.length
        );

        for (let i = 0; i < maxLength; i++) {
          const originalPara = originalParagraphs[i] || "";
          const translatedPara = translatedParagraphs[i] || "";

          if (originalPara.trim() || translatedPara.trim()) {
            combined += `${originalPara.trim()}\n\n> ${translatedPara.trim()}\n\n`;
          }
        }
        combined = combined.trim();
      } else if (selectedCombineFormat === "inComments") {
        const targetLangDisplay =
          AVAILABLE_LANGUAGES.find((lang) => lang.value === targetLanguage)
            ?.label || targetLanguage;

        const sourceLocale = getLocaleFromLanguageValue(detectedLanguage);
        const noteTextInSourceLanguage =
          COMMENT_NOTES_BY_LOCALE[sourceLocale] ||
          COMMENT_NOTES_BY_LOCALE["en"];

        const fullTranslationNote = `> ${noteTextInSourceLanguage}`;

        const forPublishingText = t(
          "refineFormatCard.inComments_forPublishingAsComment",
          { language: targetLangDisplay }
        );
        const startCopyText = t("refineFormatCard.inComments_startCopying");
        const endCopyText = t("refineFormatCard.inComments_endCopying");
        combined = `${originalContent}\n\n${fullTranslationNote}\n\n---\n**${forPublishingText}**\n---\n**${startCopyText}**\n---\n${translatedContent}\n---\n**${endCopyText}**\n---`;
      }
      setFinalCombinedOutput(combined);
      // Reemplazar el contenido del editor principal con el texto combinado
      setArticleMarkdown(combined);
      // localStorage.setItem(FINAL_REVIEW_ARTICLE_STORAGE_KEY, combined); // Moved to handleProceedToReview
      setCurrentOperationMessage(null);
      toast({
        title: t("toastMessages.successTitle"),
        description: t("toastMessages.combinedFormatSuccess"),
      });
      setActiveAction(null); // Ocultar el panel de combinación
    });
  };

  const generateSummaryTextForCopy = () => {
    let summary = `${t("sessionSummaryCard.title")}\n`;
    summary += "=============================\n\n";
    summary += `${t("sessionSummaryCard.workflowLabel")} ${
      initialWorkflow === "aiCreate"
        ? t("startArticleCard.aiCreateLabel")
        : t("startArticleCard.userWriteLabel")
    }\n`;
    if (detectedLanguage) {
      summary += `${t(
        "sessionSummaryCard.detectedLanguageLabel"
      )} ${detectedLanguage}\n`;
    }
    summary += "\n";
    summary += `${t("sessionSummaryCard.tokenUsageTitle")}:\n`;
    summary += `-----------------------------\n`;
    summary += `${t(
      "sessionSummaryCard.totalTokensUsedLabel"
    )} ${sessionTotalTokens.toLocaleString()}\n`;
    if (sessionTextTokensUsed > 0) {
      summary += `  ${t(
        "sessionSummaryCard.textGenerationTokensLabel"
      )} ${sessionTextTokensUsed.toLocaleString()}\n`;
    }
    if (sessionImageTokensUsed > 0) {
      summary += `  ${t(
        "sessionSummaryCard.imageGenerationTokensLabel"
      )} ${sessionImageTokensUsed.toLocaleString()}\n`;
    }
    summary += "-----------------------------\n\n";

    if (finalCombinedOutput.trim()) {
      summary += `${t("refineFormatCard.combinedOutputTitle")}\n`;
      summary += "-----------------------------\n";
      summary += finalCombinedOutput;
    } else {
      summary += `${t("sessionSummaryCard.noFinalCombinedArticleMessage")}\n`;
    }
    return summary;
  };

  const handleCopySummary = () => {
    startProcessingTransition(async () => {
      setCurrentOperationMessage(
        t("sessionSummaryCard.preparingSummaryMessage")
      );
      const summaryText = generateSummaryTextForCopy();
      try {
        await navigator.clipboard.writeText(summaryText);
        toast({
          title: t("toastMessages.successTitle"),
          description: t("toastMessages.summaryCopiedSuccess"),
        });
      } catch (err) {
        console.error("Failed to copy summary: ", err);
        toast({
          title: t("toastMessages.errorTitle"),
          description: t("toastMessages.copySummaryFailedError"),
          variant: "destructive",
        });
      } finally {
        setCurrentOperationMessage(null);
      }
    });
  };

  const clearAll = () => {
    setInitialWorkflow("aiCreate");
    setPrompt("");
    setArticleMarkdown("");
    setTargetLanguage(DEFAULT_TARGET_LANGUAGE);
    setSourceLanguageForCreation(DEFAULT_SOURCE_LANGUAGE_CREATION);
    setTranslatedArticleMarkdown("");
    setOriginalArticleForTranslation("");
    setCurrentOperationMessage(null);
    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);
    setGenerateMainImage(false);
    setFinalCombinedOutput("");
    setSelectedCombineFormat("simple");
    setDetectedLanguage(null);
    setSessionTotalTokens(0);
    setSessionTextTokensUsed(0);
    setSessionImageTokensUsed(0);
    toast({
      title: t("toastMessages.clearedTitle"),
      description: t("toastMessages.allClearedMessage"),
    });
  };

  const handleProceedToReview = () => {
    let title = t("proceedToReviewCard.defaultTitle", {
      defaultValue: "Generated Article",
    });
    const lines = finalCombinedOutput.split("\n");
    if (lines.length > 0 && lines[0].startsWith("# ")) {
      title = lines[0].substring(2).trim();
    }

    const dataToStore: StoredArticleData = {
      title: title,
      content: finalCombinedOutput,
    };
    localStorage.setItem(
      FINAL_REVIEW_ARTICLE_STORAGE_KEY,
      JSON.stringify(dataToStore)
    );
    router.push("/final-review");
  };

  if (clientLoaded && isLoadingHiveAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size={48} />
        <p className="ml-2">{t("loadingSpinnerClient")}</p>{" "}
      </div>
    );
  }
  const tokensLeftInSession = Math.max(
    0,
    ESTIMATED_INITIAL_SESSION_TOKENS - sessionTotalTokens
  );

  const mainActionHandler =
    initialWorkflow === "aiCreate"
      ? handleCreateArticle
      : handleStartUserWriting;

  const handleTogglePreviewLayout = () => {
    setPreviewLayout((prevLayout) =>
      prevLayout === "side" ? "bottom" : "side"
    );
    if (!isPreviewExpanded) {
      setIsPreviewExpanded(true); // Asegurar que la vista previa esté visible al cambiar layout
    }
  };

  const handleToggleImageModal = () => {
    setIsImageModalOpen(!isImageModalOpen);
  };

  const handleInsertImagesFromModal = (
    images: Array<{ imageUrl: string; postUrl?: string; altText?: string }>
  ) => {
    const textarea = mainTextareaRef.current;
    if (!textarea) return;

    // Usar t() para el texto alternativo, con un valor por defecto
    const imageMarkdown = images
      .map((img) => {
        let alt =
          img.altText ||
          t("toolbar.imageAltTextPlaceholder", {
            defaultValue: "image description",
          });
        if (alt.length > 20) {
          alt = `${alt.substring(0, 20)}...`;
        }
        let md = `![${alt}](${img.imageUrl})`;
        if (img.postUrl) {
          const linkText = t("toolbar.imageCreditLinkText", {
            defaultValue: "source",
          });
          md += `\n[${linkText}](${img.postUrl})`;
        }
        return md;
      })
      .join("\n\n");

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newMarkdown =
      articleMarkdown.substring(0, start) +
      imageMarkdown +
      (start === end ? "\n" : "") + // Añade un salto de línea si no hay selección
      articleMarkdown.substring(end);

    setArticleMarkdown(newMarkdown);
    setIsImageModalOpen(false); // Cierra el modal

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + imageMarkdown.length,
        start + imageMarkdown.length
      );
    }, 0);
  };

  const handleApplyLineFromReviewer = (
    originalLineIndex: number,
    revisedLineText: string
  ) => {
    // Esta es una implementación MUY BÁSICA y puede no ser robusta
    // para todos los casos de edición. Considera una librería de diff/patch para producción.
    setArticleMarkdown((prevMarkdown) => {
      const lines = prevMarkdown.split("\n");
      // Asumimos que 'originalLineIndex' se refiere al índice en el 'revisedContentForReview'
      // y que queremos reemplazar la línea correspondiente en el 'articleMarkdown' actual.
      // Esto es problemático si el número de líneas difiere mucho o si el usuario ya editó.
      // Por ahora, simplemente reemplazaremos la línea en el índice dado si existe.
      if (originalLineIndex < lines.length) {
        lines[originalLineIndex] = revisedLineText;
        return lines.join("\n");
      }
      // Si el índice está fuera de rango, podríamos añadirla al final o ignorar.
      // Para este placeholder, la añadimos si el índice es el siguiente a la última línea.
      if (originalLineIndex === lines.length) {
        return prevMarkdown + "\n" + revisedLineText;
      }
      return prevMarkdown;
    });
    toast({
      title: "Line Applied",
      description: "The selected line has been applied to the editor.",
    });
  };

  const handleApplyAllVisibleChangesFromReviewer = (
    newFullMarkdown: string
  ) => {
    setArticleMarkdown(newFullMarkdown); // Reemplaza todo el contenido del editor
    setArticleBeforeRevision(articleMarkdown); // Guardar el estado anterior para un posible "Undo" general
    toast({
      title: "All Changes Applied",
      description: "All visible revisions have been applied to the editor.",
    });
  };

  const RevisionOptionsPanel = () => {
    const handleApplyRevision = () => {
      if (selectedRevisionType === "full") {
        handleReviseArticle();
      } else if (selectedRevisionType === "selective") {
        setCurrentOperationMessage(t("editArticleCard.revisingArticleMessage"));
        // setIsLoading(true); // Esta línea causa el error y es innecesaria, isProcessing lo manejará
        startProcessingTransition(async () => {
          try {
            const response = await authenticatedFetch(
              "/api/ai/revise-article-input",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ articleContent: articleMarkdown }),
              }
            );
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.message || "Failed to fetch revision for review."
              );
            }
            const result = await response.json();
            setRevisedContentForReview(result.revisedText);
            setIsLineReviewerOpen(true);
            setActiveAction(null); // Cerrar el panel de opciones
          } catch (error: any) {
            console.error(
              "Error fetching revision for selective review:",
              error
            );
            toast({
              title: t("toastMessages.errorTitle"),
              description:
                error.message || t("toastMessages.reviseFailedError"),
              variant: "destructive",
            });
          } finally {
            setCurrentOperationMessage(null);
            // setIsLoading(false); // useTransition lo maneja
          }
        });
      }
    };

    const handleApplyLineFromReviewer = (
      originalLineIndex: number,
      revisedLineText: string
    ) => {
      // Esta es una implementación MUY BÁSICA y puede no ser robusta
      // para todos los casos de edición. Considera una librería de diff/patch para producción.
      setArticleMarkdown((prevMarkdown) => {
        const lines = prevMarkdown.split("\n");
        // Asumimos que 'originalLineIndex' se refiere al índice en el 'revisedContentForReview'
        // y que queremos reemplazar la línea correspondiente en el 'articleMarkdown' actual.
        // Esto es problemático si el número de líneas difiere mucho o si el usuario ya editó.
        // Por ahora, simplemente reemplazaremos la línea en el índice dado si existe.
        if (originalLineIndex < lines.length) {
          lines[originalLineIndex] = revisedLineText;
          return lines.join("\n");
        }
        // Si el índice está fuera de rango, podríamos añadirla al final o ignorar.
        // Para este placeholder, la añadimos si el índice es el siguiente a la última línea.
        if (originalLineIndex === lines.length) {
          return prevMarkdown + "\n" + revisedLineText;
        }
        return prevMarkdown;
      });
      toast({
        title: "Line Applied",
        description: "The selected line has been applied to the editor.",
      });
    };

    const handleApplyAllVisibleChangesFromReviewer = (
      newFullMarkdown: string
    ) => {
      setArticleMarkdown(newFullMarkdown); // Reemplaza todo el contenido del editor
      setArticleBeforeRevision(articleMarkdown); // Guardar el estado anterior para un posible "Undo" general
      toast({
        title: "All Changes Applied",
        description: "All visible revisions have been applied to the editor.",
      });
    };

    return (
      <Card className="mt-4 bg-muted/40 shadow">
        <CardContent className="flex items-center gap-3 p-3">
          <select
            value={selectedRevisionType}
            onChange={(e) =>
              setSelectedRevisionType(e.target.value as RevisionType)
            }
            className="flex-grow p-2 border rounded-md bg-background text-sm"
            disabled={isLoading}
          >
            <option value="full">
              {t("revisionOptionsPanel.optionFullAI", {
                defaultValue: "Full AI Revision (with Undo)",
              })}
            </option>
            <option value="selective">
              {t("revisionOptionsPanel.optionSelective", {
                defaultValue: "Let me decide what to apply (Show Diff)",
              })}
            </option>
          </select>
          <Button
            onClick={handleApplyRevision}
            disabled={isLoading || !articleMarkdown.trim()}
            size="sm"
          >
            {isLoading &&
            currentOperationMessage ===
              t("editArticleCard.revisingArticleMessage") ? (
              <LoadingSpinner size={16} className="mr-2" />
            ) : (
              <Edit3 className="mr-2 h-4 w-4" />
            )}
            {t("revisionOptionsPanel.applyButton", {
              defaultValue: "Apply Revision",
            })}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const handleApplyFormat = (formatType: MarkdownFormatType) => {
    const textarea = mainTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = articleMarkdown.substring(start, end);
    let newText = "";
    let newCursorPos = end;
    let textToInsert = ""; // Para placeholders

    switch (formatType) {
      case "bold":
        textToInsert =
          selectedText ||
          t("toolbar.boldPlaceholder", {
            // Corregido
            defaultValue: "bold text",
          });
        newText = `**${textToInsert}**`;
        newCursorPos =
          start + (selectedText ? newText.length : 2 + textToInsert.length);
        if (!selectedText) newCursorPos = start + 2; // Posicionar cursor dentro de los asteriscos
        break;
      case "italic":
        textToInsert =
          selectedText ||
          t("toolbar.italicPlaceholder", {
            // Corregido
            defaultValue: "italic text",
          });
        newText = `*${textToInsert}*`;
        newCursorPos =
          start + (selectedText ? newText.length : 1 + textToInsert.length);
        if (!selectedText) newCursorPos = start + 1;
        break;
      case "strikethrough":
        textToInsert =
          selectedText ||
          t("toolbar.strikethroughPlaceholder", {
            // Corregido
            defaultValue: "strikethrough",
          });
        newText = `~~${textToInsert}~~`;
        newCursorPos =
          start + (selectedText ? newText.length : 2 + textToInsert.length);
        if (!selectedText) newCursorPos = start + 2;
        break;
      case "link":
        // eslint-disable-next-line no-case-declarations
        const urlFromPrompt = window.prompt(
          // Usar window.prompt para evitar colisión con la variable de estado 'prompt'
          t("toolbar.linkPrompt", {
            // Corregido
            defaultValue: "Enter link URL:",
          }),
          "https://"
        );
        if (urlFromPrompt) {
          textToInsert =
            selectedText ||
            t("toolbar.linkTextPlaceholder", {
              // Corregido
              defaultValue: "link text",
            });
          newText = `${textToInsert}`; // Formato Markdown correcto para enlaces
          if (selectedText) {
            // Si había texto seleccionado, el cursor va al final del enlace insertado
            // Si había texto seleccionado, el cursor va al final del enlace insertado
            newCursorPos = start + newText.length;
          } else {
            // Si no había texto seleccionado, el cursor va dentro de los corchetes para que el usuario escriba el texto del enlace
            newCursorPos = start + 1; // Después de '['
          }
        } else {
          return; // User cancelled prompt
        }
        break;
      case "h1":
      case "h2":
      case "h3":
        // eslint-disable-next-line no-case-declarations
        const prefix =
          formatType === "h1" ? "# " : formatType === "h2" ? "## " : "### ";
        textToInsert =
          selectedText ||
          t("toolbar.headingPlaceholder", {
            // Corregido
            defaultValue: "Heading",
          });
        if (start === 0 || articleMarkdown[start - 1] === "\n") {
          newText = `${prefix}${textToInsert}`;
        } else {
          newText = `\n${prefix}${textToInsert}`;
        }
        newCursorPos =
          start + newText.length - (selectedText ? 0 : textToInsert.length);
        if (!selectedText) newCursorPos = start + newText.indexOf(textToInsert);
        break;
      case "ul":
      case "ol":
        // eslint-disable-next-line no-case-declarations
        const listPrefix = formatType === "ul" ? "- " : "1. ";
        textToInsert =
          selectedText ||
          t("toolbar.listItemPlaceholder", {
            // Corregido
            defaultValue: "List item",
          });
        newText = selectedText
          ? selectedText
              .split("\n")
              .map((line) => `${listPrefix}${line}`)
              .join("\n")
          : `${listPrefix}${textToInsert}`;
        newCursorPos = start + newText.length;
        break;
      case "quote":
        textToInsert =
          selectedText ||
          t("toolbar.quotePlaceholder", {
            // Corregido
            defaultValue: "Quote",
          });
        newText = selectedText
          ? selectedText
              .split("\n")
              .map((line) => `> ${line}`)
              .join("\n")
          : `> ${textToInsert}`;
        newCursorPos = start + newText.length;
        break;
      case "codeblock":
        textToInsert =
          selectedText ||
          t("toolbar.codeBlockPlaceholder", {
            // Corregido
            defaultValue: "code",
          });
        newText = `\`\`\`\n${textToInsert}\n\`\`\``;
        newCursorPos =
          start +
          4 +
          (selectedText ? selectedText.length : textToInsert.length);
        if (!selectedText) newCursorPos = start + 4; // Cursor dentro del bloque
        break;
      case "hr":
        newText =
          (start > 0 && articleMarkdown[start - 1] !== "\n" ? "\n" : "") +
          "---\n";
        newCursorPos = start + newText.length;
        break;
      case "image_url":
        // eslint-disable-next-line no-case-declarations
        const imageUrlFromPrompt = window.prompt(
          t("toolbar.imageUrlPrompt", { defaultValue: "Enter image URL:" })
        );
        if (imageUrlFromPrompt) {
          const altText =
            window.prompt(
              t("toolbar.imageAltTextPrompt", {
                defaultValue: "Enter image alt text (optional):",
              })
            ) || t("toolbar.imageAltTextDefault", { defaultValue: "image" });
          newText = `!${altText}`;
          newCursorPos = start + newText.length;
        } else {
          return; // User cancelled prompt
        }
        newText =
          (start > 0 && articleMarkdown[start - 1] !== "\n" ? "\n" : "") +
          "---\n";
        newCursorPos = start + newText.length;
        break;
      default:
        return;
    }

    const updatedMarkdown =
      articleMarkdown.substring(0, start) +
      newText +
      articleMarkdown.substring(end);
    setArticleMarkdown(updatedMarkdown);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // --- Helper Components (inline for brevity, consider moving to separate files) ---
  const EditorActionsMenu = ({
    onActionChange,
    currentActiveAction,
    onTogglePreview,
    isPvExpanded,
    onClear,
    onCpySummary,
    canRevise,
    canTranslate,
    canCombine,
  }: {
    onActionChange: (action: ActiveEditorAction) => void;
    currentActiveAction: ActiveEditorAction;
    onTogglePreview: () => void;
    isPvExpanded: boolean;
    onClear: () => void;
    onCpySummary: () => void;
    canRevise: boolean;
    canTranslate: boolean;
    canCombine: boolean;
  }) => (
    <Card className="mb-4 shadow">
      {" "}
      {/* Eliminado p-2 para que CardContent controle el padding */}
      <CardContent className="flex flex-wrap gap-2 items-center p-2">
        <Button
          onClick={() =>
            // Ahora activa el panel de opciones de revisión
            onActionChange(currentActiveAction === "revise" ? null : "revise")
          }
          variant={currentActiveAction === "revise" ? "default" : "outline"} // Variante condicional
          size="sm"
          disabled={isLoading || !canRevise}
        >
          <Edit3 className="mr-2 h-4 w-4" />
          {t("actions.revise", { defaultValue: "Revise" })}
        </Button>
        <Button
          onClick={() =>
            onActionChange(
              currentActiveAction === "translate" ? null : "translate"
            )
          }
          variant={currentActiveAction === "translate" ? "default" : "outline"}
          size="sm"
          disabled={isLoading || !canTranslate}
        >
          <Languages className="mr-2 h-4 w-4" />
          {t("actions.translate", { defaultValue: "Translate" })}
        </Button>
        <Button
          onClick={() =>
            onActionChange(currentActiveAction === "combine" ? null : "combine")
          }
          variant={currentActiveAction === "combine" ? "default" : "outline"}
          size="sm"
          disabled={isLoading || !canCombine}
        >
          <Combine className="mr-2 h-4 w-4" />
          {t("actions.combine", { defaultValue: "Combine" })}
        </Button>
        {/* Botón Deshacer Revisión */}
        {articleBeforeRevision && (
          <Button
            onClick={handleUndoRevision}
            variant="outline"
            size="sm"
            className="text-orange-600 border-orange-500 hover:bg-orange-100 hover:text-orange-700"
            disabled={isLoading}
          >
            <Undo2 className="mr-2 h-4 w-4" />
            {t("actions.undoRevision", { defaultValue: "Undo Revision" })}
          </Button>
        )}
        <Button
          onClick={onTogglePreview}
          variant="outline"
          size="sm"
          className="ml-auto"
          disabled={isLoading}
        >
          {isPvExpanded ? (
            <EyeOff className="mr-2 h-4 w-4" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          {isPvExpanded
            ? t("actions.hidePreview", { defaultValue: "Hide Preview" })
            : t("actions.showPreview", { defaultValue: "Show Preview" })}
        </Button>
        {/* Popover para EditorTokenUsage */}
        {sessionTotalTokens > 0 && ( // Solo mostrar si hay tokens usados
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                title={tTokenUsage("title")}
              >
                <Coins className="mr-2 h-4 w-4" /> Tokens
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              {" "}
              {/* p-0 porque EditorTokenUsage ya tiene padding interno */}
              <EditorTokenUsage
                currentRequestTokens={currentRequestTokens}
                detailedTokenUsage={detailedTokenUsage}
                sessionTotalTokens={sessionTotalTokens}
                estimatedInitialSessionTokens={ESTIMATED_INITIAL_SESSION_TOKENS}
                tokensLeftInSession={tokensLeftInSession}
                tTokenUsage={tTokenUsage}
              />
            </PopoverContent>
          </Popover>
        )}
        <Button
          onClick={onCpySummary}
          variant="outline"
          size="sm"
          disabled={isLoading || sessionTotalTokens === 0}
        >
          <Copy className="mr-2 h-4 w-4" />
          {t("actions.copySummary", { defaultValue: "Copy Summary" })}
        </Button>
        <Button
          onClick={onClear}
          variant="destructive"
          size="sm"
          disabled={isLoading}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("actions.clearAll", { defaultValue: "Clear All" })}
        </Button>
      </CardContent>
    </Card>
  );

  const MarkdownPreview = ({ content }: { content: string }) => (
    <Card className="shadow h-full">
      {" "}
      {/* h-full para que ocupe el espacio en side-by-side */}
      <CardHeader>
        <CardTitle>
          {t("markdownPreview.title", { defaultValue: "Markdown Preview" })}
        </CardTitle>
      </CardHeader>
      <CardContent className="prose dark:prose-invert max-w-none">
        <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
      </CardContent>
    </Card>
  );

  const TranslationPanel = () => (
    <Card className="mt-4 bg-muted/40 shadow">
      <CardContent className="flex items-center gap-3 p-3">
        <select
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
          className="flex-grow p-2 border rounded-md bg-background text-sm"
          disabled={isLoading}
        >
          {AVAILABLE_LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        {translationProgress &&
          isLoading && ( // Mostrar progreso solo si está cargando
            <div className="text-sm text-muted-foreground">
              {t("translateArticleCard.translatingChunkMessage", {
                current: translationProgress.current,
                total: translationProgress.total,
              })}
            </div>
          )}
        <Button
          onClick={handleTranslateArticle}
          disabled={
            isLoading || !articleMarkdown.trim() || !targetLanguage.trim()
          }
          size="sm" // Botón más pequeño para que encaje bien
        >
          {isLoading &&
          currentOperationMessage?.includes(
            t("translateArticleCard.translatingChunkMessage", {
              current: 1,
              total: 1,
            }).substring(0, 10)
          ) ? (
            <LoadingSpinner size={16} className="mr-2" />
          ) : (
            <Languages className="mr-2 h-4 w-4" /> // Icono para el botón
          )}
          {t("translateArticleCard.translateButton")}
        </Button>
      </CardContent>
    </Card>
  );

  const CombinePanel = () => (
    <Card className="mt-4 bg-muted/40 shadow">
      <CardContent className="flex items-center gap-3 p-3">
        {/* Basic format selector for now, can be improved */}
        <select
          value={selectedCombineFormat}
          onChange={(e) =>
            setSelectedCombineFormat(e.target.value as CombineFormatType)
          }
          className="flex-grow p-2 border rounded-md bg-background text-sm"
          disabled={isLoading}
        >
          <option value="simple">
            {t("refineFormatCard.formatSimpleLabel", {
              defaultValue: "Simple (Original + HR + Translation)",
            })}
          </option>
          <option value="detailsTag">
            {t("refineFormatCard.formatDetailsTag", {
              defaultValue: "Details Tag (Collapsible Translation)",
            })}
          </option>
          <option value="inline">
            {t("refineFormatCard.formatInlineLabel", {
              defaultValue: "Inline (Original Para > Translated Para)",
            })}
          </option>
          <option value="inComments">
            {t("refineFormatCard.formatInCommentsLabel", {
              defaultValue: "For Comments (Translation separate)",
            })}
          </option>
        </select>
        <Button
          onClick={handleCombineFormat}
          disabled={
            isLoading ||
            !originalArticleForTranslation.trim() ||
            !translatedArticleMarkdown.trim()
          }
          size="sm" // Botón más pequeño para que encaje bien
        >
          {isLoading &&
          currentOperationMessage ===
            t("refineFormatCard.generatingCombinedMessage") ? (
            <LoadingSpinner size={16} className="mr-2" />
          ) : null}
          {t("refineFormatCard.generateCombinedButton")}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div
      className="relative space-y-8 p-4 md:p-6 rounded-lg 
                    before:absolute before:inset-0 
                    before:bg-[url('/images/bg-writing.jpg')] before:bg-cover before:bg-center
                    before:opacity-30 before:rounded-lg before:-z-10"
    >
      <GlobalLoader
        isLoading={isProcessing}
        operationMessage={currentOperationMessage}
      />

      {canUseEditor ? (
        <>
          {/* <div className="fixed top-4 right-4 z-50"> // Movido de aquí
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full shadow-lg"
                >
                  <InfoIcon className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <EditorTokenUsage
                  currentRequestTokens={currentRequestTokens}
                  detailedTokenUsage={detailedTokenUsage}
                  sessionTotalTokens={sessionTotalTokens}
                  estimatedInitialSessionTokens={
                    ESTIMATED_INITIAL_SESSION_TOKENS
                  }
                  tokensLeftInSession={tokensLeftInSession}
                  tTokenUsage={tTokenUsage}
                />
              </PopoverContent>
            </Popover>
          </div> */}

          {/* <StartArticleCard
            initialWorkflow={initialWorkflow}
            onInitialWorkflowChange={
              userRole === "admin"
                ? (value: InitialWorkflow) => {
                    setInitialWorkflow(value);
                    if (value === "userWrite") {
                      setPrompt("");
                      setGenerateMainImage(false);
                    }
                  }
                : undefined
            }
            prompt={prompt}
            onPromptChange={setPrompt}
            generateMainImage={generateMainImage}
            sourceLanguageForCreation={sourceLanguageForCreation}
            onSourceLanguageForCreationChange={setSourceLanguageForCreation}
            onGenerateMainImageChange={setGenerateMainImage}
            onMainAction={mainActionHandler}
            onClearAll={clearAll}
            isLoading={isLoading}
            currentOperationMessage={currentOperationMessage}
            t={(key, values) => t(`startArticleCard.${key}`, values)}
            isAdmin={userRole === "admin"}
          /> */}

          {/* {detectedLanguage && articleMarkdown && ( // Keep if language detection is still desired
            <DetectedLanguageInfo detectedLanguage={detectedLanguage} t={(key, values) => t(`detectLanguageCard.${key}`, values)} />
          )} */}

          {/* Only show editor actions if there's some markdown or user initiated writing */}
          {(articleMarkdown || initialWorkflow === "userWrite") && (
            <EditorActionsMenu
              onActionChange={setActiveAction}
              currentActiveAction={activeAction}
              onTogglePreview={() => setIsPreviewExpanded(!isPreviewExpanded)}
              isPvExpanded={isPreviewExpanded}
              onClear={clearAll}
              onCpySummary={handleCopySummary}
              canRevise={!!articleMarkdown.trim()}
              canTranslate={!!articleMarkdown.trim()}
              canCombine={
                !!originalArticleForTranslation.trim() &&
                !!translatedArticleMarkdown.trim()
              }
            />
          )}

          {/* Panel de Traducción - se muestra aquí cuando activeAction es 'translate' */}
          {activeAction === "translate" && articleMarkdown.trim() && (
            <TranslationPanel />
          )}

          {/* Panel de Combinación - se muestra aquí cuando activeAction es 'combine' */}
          {activeAction === "combine" &&
            originalArticleForTranslation.trim() &&
            translatedArticleMarkdown.trim() && <CombinePanel />}

          {/* Panel de Opciones de Revisión - se muestra aquí cuando activeAction es 'revise' */}
          {activeAction === "revise" && articleMarkdown.trim() && (
            <RevisionOptionsPanel />
          )}

          {/* EditorTokenUsage ha sido movido al EditorActionsMenu */}

          {/* Main Editor Area - always show if user has started writing or AI generated content */}
          {(articleMarkdown || initialWorkflow === "userWrite") && (
            <div
              className={`
                ${
                  isPreviewExpanded && previewLayout === "side"
                    ? "flex flex-col md:flex-row gap-4"
                    : "flex flex-col"
                }
              `}
            >
              {/* Editor Column/Area */}
              <div
                className={
                  isPreviewExpanded && previewLayout === "side"
                    ? "w-full md:w-1/2 flex flex-col"
                    : "w-full"
                }
              >
                <MarkdownToolbar
                  onApplyFormat={handleApplyFormat}
                  onToggleImageModal={handleToggleImageModal}
                  disabled={isLoading}
                  onToggleLayout={handleTogglePreviewLayout} // Nueva prop
                  currentLayout={previewLayout} // Nueva prop
                />
                <textarea
                  ref={mainTextareaRef}
                  value={articleMarkdown}
                  onChange={(e) => setArticleMarkdown(e.target.value)}
                  placeholder={t("mainEditor.placeholder", {
                    defaultValue:
                      "Start writing your article here in Markdown...",
                  })}
                  className="w-full min-h-[300px] p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary-focus transition-shadow bg-background flex-grow" // flex-grow para que ocupe espacio
                  disabled={isLoading}
                />
              </div>

              {/* Preview Column/Area */}
              {isPreviewExpanded && (
                <div
                  className={
                    isPreviewExpanded && previewLayout === "side"
                      ? "w-full md:w-1/2"
                      : "w-full mt-4"
                  }
                >
                  <MarkdownPreview content={articleMarkdown} />
                </div>
              )}
            </div>
          )}

          {/* Contextual Action Panels */}
          {/* El panel de activeAction === "revise" se ha eliminado para el flujo directo */}
          {/* CombinePanel movido arriba */}

          {/* Session Summary - now part of Popover or could be a separate action */}
          {/* {sessionTotalTokens > 0 && (
            <SessionSummaryCard
              // ... props ...
            />
          )}
          */}

          {finalCombinedOutput && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>{t("proceedToReviewCard.title")}</CardTitle>
                <CardDescription>
                  {t("proceedToReviewCard.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleProceedToReview}
                  className="w-full md:w-auto"
                >
                  {t("proceedToReviewCard.buttonText")}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Modal para ImageSearchAndInsert, controlado por la barra de herramientas */}
          <ImageSearchAndInsert
            mode="modal"
            apiEndpoint="https://hivelens.duckdns.org/api/search" // Asegúrate que este sea el endpoint correcto o usa una variable
            isOpen={isImageModalOpen}
            onOpenChange={setIsImageModalOpen}
            onInsertImages={handleInsertImagesFromModal}
            maxSelectable={5}
            modalTitle={t("imageSearchAndInsert.modalTitle", {
              // Corregido
              defaultValue: "Search and Add Images from Hivelens",
            })}
            placeholderText={t("imageSearchAndInsert.placeholderText", {
              // Corregido
              defaultValue: "Search images in Hivelens...",
            })}
            insertButtonText={t("imageSearchAndInsert.insertButtonText", {
              // Corregido
              defaultValue: "Insert selected",
            })}
            searchButtonText={t("imageSearchAndInsert.searchButtonText", {
              // Corregido
              defaultValue: "Search",
            })}
          />

          <LineReviewer
            isOpen={isLineReviewerOpen}
            onOpenChange={setIsLineReviewerOpen}
            originalMarkdown={articleMarkdown} // El contenido actual del editor es el "original" para esta revisión
            revisedMarkdown={revisedContentForReview}
            onApplyLine={handleApplyLineFromReviewer}
            onApplyAllVisibleChanges={handleApplyAllVisibleChangesFromReviewer}
            tLineReviewer={{
              // Pasar traducciones
              title: t("lineReviewer.title"),
              description: t("lineReviewer.description"),
              applyLineButtonTitle: t("lineReviewer.applyLineButtonTitle"),
              removeLineButtonTitle: t("lineReviewer.removeLineButtonTitle"),
              applyAllVisibleButtonText: t(
                "lineReviewer.applyAllVisibleButtonText"
              ),
              closeButtonText: t("lineReviewer.closeButtonText"),
              noLinesToReviewText: t("lineReviewer.noLinesToReviewText"),
            }}
          />
        </>
      ) : clientLoaded && !isLoadingHiveAuth ? (
        <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center text-center p-6 space-y-4">
          <LoadingSpinner size={48} />
        </div>
      ) : (
        <div className="min-h-[calc(100vh-200px)]"></div>
      )}
    </div>
  );
}
