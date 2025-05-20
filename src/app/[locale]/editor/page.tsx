"use client";

// import { // Eliminamos la importación del flow local de traducción
//   translateArticle,
//   TranslateArticleInput,
//   TranslateArticleOutput,
// } from "@/ai/flows/translate-article";
import DetectedLanguageInfo from "@/components/editor-sections/DetectedLanguageInfo";
import EditAndRefineCard from "@/components/editor-sections/EditAndRefineCard";
import EditorTokenUsage from "@/components/editor-sections/EditorTokenUsage";
import RefineCombinedFormatCard, {
  CombineFormatType,
} from "@/components/editor-sections/RefineCombinedFormatCard";
import SessionSummaryCard from "@/components/editor-sections/SessionSummaryCard";
import StartArticleCard from "@/components/editor-sections/StartArticleCard";
import TranslateArticleCard from "@/components/editor-sections/TranslateArticleCard";
import TranslationResultView from "@/components/editor-sections/TranslationResultView";
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
  AVAILABLE_LANGUAGES,
  COMMENT_NOTES_BY_LOCALE,
  DEFAULT_SOURCE_LANGUAGE_CREATION,
  DEFAULT_TARGET_LANGUAGE,
  ESTIMATED_INITIAL_SESSION_TOKENS,
} from "@/constants/constants";
import { useHiveAuth } from "@/hooks/use-hive-auth";
import { useToast } from "@/hooks/use-toast";
import { getLocaleFromLanguageValue } from "@/utils/language";
import { splitMarkdownIntoParagraphs } from "@/utils/markdown";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type InitialWorkflow = "aiCreate" | "userWrite";
const FINAL_REVIEW_ARTICLE_STORAGE_KEY = "hivePad_finalReviewArticle"; // Definir la clave

export default function ArticleForgePage() {
  const t = useTranslations("ArticleForgePage");
  const tTokenUsage = useTranslations("TokenUsage");
  const router = useRouter();

  const {
    isAuthenticated: isHiveLoggedIn,
    isLoading: isLoadingHiveAuth,
    authenticatedFetch,
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

  const [isProcessing, startProcessingTransition] = useTransition();

  const [clientLoaded, setClientLoaded] = useState(false);

  const { toast } = useToast();

  const isLoading = isProcessing || isLoadingHiveAuth;

  useEffect(() => {
    setClientLoaded(true);
  }, []);

  useEffect(() => {
    if (clientLoaded && !isLoadingHiveAuth && !isHiveLoggedIn) {
      router.push("/login");
    }
  }, [clientLoaded, isLoadingHiveAuth, isHiveLoggedIn, router]);

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

    startProcessingTransition(async () => {
      try {
        // Construir el prompt mejorado
        const enhancedPrompt = `You are an expert article writer. Write an article of approximately 1000 words in ${sourceLanguageForCreation} in Markdown format based on the following prompt:\n\nPrompt: ${prompt}`;

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
        setArticleMarkdown(result.generatedText);

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
      toast({
        title: t("toastMessages.errorTitle"),
        description: t("toastMessages.articleEmptyError"),
        variant: "destructive",
      });
      return;
    }
    setCurrentOperationMessage(t("editArticleCard.revisingArticleMessage"));
    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);
    setFinalCombinedOutput("");
    startProcessingTransition(async () => {
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
            body: JSON.stringify({
              articleContent: articleMarkdown, // Enviar el contenido del artículo
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              `Failed to revise article. Server responded with ${response.status}`
          );
        }

        const result = await response.json();
        setArticleMarkdown(result.revisedText); // Usar revisedText del backend

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
        }); // Mantener el toast de éxito
      } catch (error) {
        console.error("Error revising article:", error);
        toast({
          title: t("toastMessages.errorTitle"),
          description: t("toastMessages.reviseFailedError"),
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

    startProcessingTransition(async () => {
      // let totalTokensForOperation = 0; // Comentado temporalmente
      // let operationDetails = { text: 0, image: 0 }; // Comentado temporalmente
      const currentArticleContent = articleMarkdown;

      try {
        setCurrentOperationMessage(
          t("translateArticleCard.translatingArticleMessage")
        );
        setOriginalArticleForTranslation(currentArticleContent);

        // Usar authenticatedFetch para la llamada a la nueva API protegida
        const response = await authenticatedFetch("/api/ai/translate-article", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            articleContent: currentArticleContent,
            targetLanguage: targetLanguage,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              `Failed to translate article. Server responded with ${response.status}`
          );
        }

        const result = await response.json();
        setTranslatedArticleMarkdown(result.translatedText);

        // TODO: Actualizar handleTokenUpdate si el backend devuelve uso de tokens
        // La ruta /api/ai/translate-article actualmente no devuelve el uso de tokens.
        // totalTokensForOperation += result.tokenUsage.totalTokens; // Asumiendo que el backend devuelve esto
        // operationDetails.text += result.tokenUsage.totalTokens; // Asumiendo que el backend devuelve esto
        // handleTokenUpdate(totalTokensForOperation, operationDetails);
        toast({
          title: t("toastMessages.successTitle"),
          description: t("toastMessages.articleTranslatedSuccess", {
            targetLanguage,
          }),
        });
      } catch (error) {
        console.error("Error in translation process:", error);
        toast({
          title: t("toastMessages.errorTitle"),
          description: t("toastMessages.translateFailedError"),
          variant: "destructive",
        });
      } finally {
        setCurrentOperationMessage(null);
      }
    });
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

      console.log("Original Content before combine:", originalContent); //TODO REM
      console.log("Translated Content before combine:", translatedContent); //TODO REM
      console.log("Selected Combine Format:", selectedCombineFormat); //TODO REM

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
          // @ts-ignore
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
      localStorage.setItem(FINAL_REVIEW_ARTICLE_STORAGE_KEY, combined); // Guardar en localStorage
      setCurrentOperationMessage(null);
      toast({
        title: t("toastMessages.successTitle"),
        description: t("toastMessages.combinedFormatSuccess"),
      });
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
          <EditorTokenUsage
            currentRequestTokens={currentRequestTokens}
            detailedTokenUsage={detailedTokenUsage}
            sessionTotalTokens={sessionTotalTokens}
            estimatedInitialSessionTokens={ESTIMATED_INITIAL_SESSION_TOKENS}
            tokensLeftInSession={tokensLeftInSession}
            tTokenUsage={tTokenUsage}
          />

          <StartArticleCard
            initialWorkflow={initialWorkflow}
            onInitialWorkflowChange={(value: InitialWorkflow) => {
              setInitialWorkflow(value);
              if (value === "userWrite") {
                setPrompt("");
                setGenerateMainImage(false);
              }
            }}
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
          />

          {detectedLanguage && articleMarkdown && (
            <DetectedLanguageInfo
              detectedLanguage={detectedLanguage}
              t={(key, values) => t(`detectLanguageCard.${key}`, values)}
            />
          )}

          {articleMarkdown && (
            <EditAndRefineCard
              articleMarkdown={articleMarkdown}
              onArticleMarkdownChange={setArticleMarkdown}
              onReviseArticle={handleReviseArticle}
              isLoading={isLoading}
              currentOperationMessage={currentOperationMessage}
              t={(key, values) => t(`editArticleCard.${key}`, values)}
            />
          )}

          {articleMarkdown && (
            <TranslateArticleCard
              targetLanguage={targetLanguage}
              onTargetLanguageChange={setTargetLanguage}
              availableLanguages={AVAILABLE_LANGUAGES} // Usar la constante importada
              detectedLanguage={detectedLanguage}
              onTranslateArticle={handleTranslateArticle}
              isLoading={isLoading}
              currentOperationMessage={currentOperationMessage}
              articleMarkdown={articleMarkdown}
              t={(key, values) => t(`translateArticleCard.${key}`, values)}
            />
          )}

          {translatedArticleMarkdown && originalArticleForTranslation && (
            <TranslationResultView
              originalArticleForTranslation={originalArticleForTranslation}
              translatedArticleMarkdown={translatedArticleMarkdown}
              targetLanguage={targetLanguage}
              detectedLanguage={detectedLanguage}
              t={(key, values) => t(`translationResultCard.${key}`, values)}
            />
          )}

          {originalArticleForTranslation && translatedArticleMarkdown && (
            <RefineCombinedFormatCard
              selectedCombineFormat={selectedCombineFormat}
              onSelectedCombineFormatChange={setSelectedCombineFormat}
              onCombineFormat={handleCombineFormat}
              finalCombinedOutput={finalCombinedOutput}
              onFinalCombinedOutputChange={setFinalCombinedOutput}
              isLoading={isLoading}
              currentOperationMessage={currentOperationMessage}
              originalArticleForTranslation={originalArticleForTranslation}
              translatedArticleMarkdown={translatedArticleMarkdown}
              t={(key, values) => t(`refineFormatCard.${key}`, values)}
            />
          )}

          {sessionTotalTokens > 0 && (
            <SessionSummaryCard
              initialWorkflow={initialWorkflow}
              detectedLanguage={detectedLanguage}
              sessionTotalTokens={sessionTotalTokens}
              sessionTextTokensUsed={sessionTextTokensUsed}
              sessionImageTokensUsed={sessionImageTokensUsed}
              finalCombinedOutput={finalCombinedOutput}
              onCopySummary={handleCopySummary}
              isLoading={isLoading}
              currentOperationMessage={currentOperationMessage}
              t={(key, values) => t(`sessionSummaryCard.${key}`, values)}
            />
          )}

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
                  onClick={() => router.push("/final-review")}
                  className="w-full md:w-auto"
                >
                  {t("proceedToReviewCard.buttonText")}
                </Button>
              </CardContent>
            </Card>
          )}
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
