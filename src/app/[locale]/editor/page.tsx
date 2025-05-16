"use client";

import {
  createArticle,
  CreateArticleInput,
  CreateArticleOutput,
} from "@/ai/flows/create-article";
import {
  detectLanguage,
  DetectLanguageInput,
  DetectLanguageOutput,
} from "@/ai/flows/detect-language-flow";
import {
  reviseArticle,
  ReviseArticleInput,
  ReviseArticleOutput,
} from "@/ai/flows/revise-article";
import {
  translateArticle,
  TranslateArticleInput,
  TranslateArticleOutput,
} from "@/ai/flows/translate-article";
import DetectedLanguageInfo from "@/components/editor-sections/DetectedLanguageInfo"; // Importar el nuevo componente
import EditAndRefineCard from "@/components/editor-sections/EditAndRefineCard"; // Importar el nuevo componente
import EditorTokenUsage from "@/components/editor-sections/EditorTokenUsage"; // Importar el nuevo componente
import RefineCombinedFormatCard, {
  CombineFormatType,
} from "@/components/editor-sections/RefineCombinedFormatCard"; // Importar el nuevo componente
import SessionSummaryCard from "@/components/editor-sections/SessionSummaryCard";
import StartArticleCard from "@/components/editor-sections/StartArticleCard"; // Importar el nuevo componente
import TranslateArticleCard from "@/components/editor-sections/TranslateArticleCard"; // Importar el nuevo componente
import TranslationResultView from "@/components/editor-sections/TranslationResultView"; // Importar el nuevo componente
import GlobalLoader from "@/components/global-loader";
import LoadingSpinner from "@/components/loading-spinner";
import { COMMENT_NOTES_BY_LOCALE } from "@/constants/constants";
import { useToast } from "@/hooks/use-toast";
import { getLocaleFromLanguageValue } from "@/utils/language";
import { splitMarkdownIntoParagraphs } from "@/utils/markdown";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

const availableLanguages = [
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Japanese", label: "Japanese" },
  { value: "Chinese (Simplified)", label: "Chinese (Simplified)" },
  { value: "Russian", label: "Russian" },
  { value: "Portuguese (Brazil)", label: "Portuguese (Brazil)" },
  { value: "Italian", label: "Italian" },
  { value: "Korean", label: "Korean" },
  { value: "Arabic", label: "Arabic" },
  { value: "English", label: "English" },
];

const ESTIMATED_INITIAL_SESSION_TOKENS = 100000;

type InitialWorkflow = "aiCreate" | "userWrite";

export default function ArticleForgePage() {
  const t = useTranslations("ArticleForgePage");
  const tTokenUsage = useTranslations("TokenUsage");

  const [prompt, setPrompt] = useState<string>("");
  const [articleMarkdown, setArticleMarkdown] = useState<string>("");
  const [targetLanguage, setTargetLanguage] = useState<string>(
    availableLanguages[0].value
  );
  const [sourceLanguageForCreation, setSourceLanguageForCreation] =
    useState<string>(
      "English" // Asegúrate que "English" esté en tu `availableLanguages` o usa otro valor por defecto
    );
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

  const isLoading = isProcessing;

  useEffect(() => {
    setClientLoaded(true);
  }, []);

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
      let totalTokensForOperation = 0;
      let operationDetails = { text: 0, image: 0 };

      try {
        const input: CreateArticleInput = {
          prompt,
          generateMainImage,
          language: sourceLanguageForCreation, // Añadir el idioma
        };
        const result: CreateArticleOutput = await createArticle(input);
        setArticleMarkdown(result.article);

        totalTokensForOperation += result.tokenUsage.totalTokens;
        operationDetails.text += result.tokenUsage.textGenerationTokens || 0;
        operationDetails.image += result.tokenUsage.imageGenerationTokens || 0;

        handleTokenUpdate(totalTokensForOperation, operationDetails);
        setTranslatedArticleMarkdown("");
        setOriginalArticleForTranslation("");
        toast({
          title: t("toastMessages.successTitle"),
          description: result.mainImageUrl
            ? t("toastMessages.articleCreatedWithImageSuccess")
            : t("toastMessages.articleCreatedSuccess"),
        });
      } catch (error) {
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
    setSourceLanguageForCreation("English"); // Resetear al empezar a escribir manualmente
    setTargetLanguage(availableLanguages[0].value);
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
        const input: ReviseArticleInput = { article: articleMarkdown };
        const result: ReviseArticleOutput = await reviseArticle(input);
        setArticleMarkdown(result.revisedArticle);
        handleTokenUpdate(result.tokenUsage.totalTokens, {
          text: result.tokenUsage.totalTokens,
        });
        setTranslatedArticleMarkdown("");
        setOriginalArticleForTranslation("");
        toast({
          title: t("toastMessages.successTitle"),
          description: t("toastMessages.articleRevisedSuccess"),
        });
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
      let totalTokensForOperation = 0;
      let operationDetails = { text: 0, image: 0 }; // Image tokens won't be used here but keep structure
      let currentArticleContent = articleMarkdown;
      let sourceLanguage = detectedLanguage;

      try {
        if (!sourceLanguage && currentArticleContent.trim()) {
          setCurrentOperationMessage(
            t("detectLanguageCard.detectingLanguageMessage")
          );
          const detectInput: DetectLanguageInput = {
            text: currentArticleContent,
          };
          const detectResult: DetectLanguageOutput = await detectLanguage(
            detectInput
          );
          setDetectedLanguage(detectResult.language);
          sourceLanguage = detectResult.language;
          totalTokensForOperation += detectResult.tokenUsage.totalTokens;
          operationDetails.text += detectResult.tokenUsage.totalTokens;
          toast({
            title: t("toastMessages.successTitle"),
            description: t("toastMessages.languageDetectedSuccess", {
              language: sourceLanguage,
            }),
          });
        }

        setCurrentOperationMessage(
          t("translateArticleCard.translatingArticleMessage")
        );
        setOriginalArticleForTranslation(currentArticleContent);
        const input: TranslateArticleInput = {
          article: currentArticleContent,
          targetLanguage,
        };
        const result: TranslateArticleOutput = await translateArticle(input);
        setTranslatedArticleMarkdown(result.translatedArticle);

        totalTokensForOperation += result.tokenUsage.totalTokens;
        operationDetails.text += result.tokenUsage.totalTokens;

        handleTokenUpdate(totalTokensForOperation, operationDetails);
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
          availableLanguages.find((lang) => lang.value === targetLanguage)
            ?.label || targetLanguage;

        // Usar `detectedLanguage` para determinar el idioma de la nota, ya que es el idioma de `originalArticleForTranslation`
        const sourceLocale = getLocaleFromLanguageValue(detectedLanguage);
        const noteTextInSourceLanguage =
          COMMENT_NOTES_BY_LOCALE[sourceLocale] ||
          COMMENT_NOTES_BY_LOCALE["en"]; // Fallback a inglés

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
    setTargetLanguage(availableLanguages[0].value);
    setSourceLanguageForCreation("English"); // Resetear al limpiar todo
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

  if (!clientLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size={48} />{" "}
        <p className="ml-2">{t("loadingSpinnerClient")}</p>
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
        isLoading={isLoading}
        operationMessage={currentOperationMessage}
      />

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
            setPrompt(""); // Limpiar prompt si se cambia a escritura manual
            setGenerateMainImage(false); // Desactivar imagen si se cambia a escritura manual
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
          availableLanguages={availableLanguages}
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
    </div>
  );
}
