"use client";

import { ImageSearchAndInsert } from "@/components/custom/ImageSearchAndInsert";
import { CombinePanelComponent } from "@/components/editor-page/CombinePanelComponent";
import { EditorActionsMenuComponent } from "@/components/editor-page/EditorActionsMenuComponent";
import { MarkdownPreviewComponent } from "@/components/editor-page/MarkdownPreviewComponent";
import { RevisionOptionsPanelComponent } from "@/components/editor-page/RevisionOptionsPanelComponent";
import { TranslationPanelComponent } from "@/components/editor-page/TranslationPanelComponent";
import { LineReviewer } from "@/components/editor-sections/LineReviewer";
import {
  MarkdownFormatType,
  MarkdownToolbar,
} from "@/components/editor-sections/MarkdownToolbar";
import StartArticleCard from "@/components/editor-sections/StartArticleCard";
import GlobalLoader from "@/components/global-loader";
import LoadingSpinner from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AVAILABLE_LANGUAGES,
  COMMENT_NOTES_BY_LOCALE,
  DEFAULT_SOURCE_LANGUAGE_CREATION,
  DEFAULT_TARGET_LANGUAGE,
  ESTIMATED_INITIAL_SESSION_TOKENS,
  FINAL_REVIEW_ARTICLE_STORAGE_KEY,
} from "@/constants/constants";
import { useHiveAuth } from "@/hooks/use-hive-auth";
import { useToast } from "@/hooks/use-toast";
import {
  ActiveEditorAction,
  CombineFormatType,
  RevisionType,
  StoredArticleData,
} from "@/types/general.types";
import { getLocaleFromLanguageValue } from "@/utils/language";
import { splitMarkdownIntoParagraphs } from "@/utils/markdown";
import { countWords } from "@/utils/text";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

export default function ArticleForgePage() {
  const t = useTranslations("ArticleForgePage");
  const tTokenUsage = useTranslations("TokenUsage");
  const router = useRouter();

  const {
    isAuthenticated: isHiveLoggedIn,
    isLoading: isLoadingHiveAuth,
    authenticatedFetch,
    userRole,
    hiveUsername,
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
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);

  const [isProcessing, startProcessingTransition] = useTransition();

  const [clientLoaded, setClientLoaded] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const [isPreviewExpanded, setIsPreviewExpanded] = useState<boolean>(false);
  const [activeAction, setActiveAction] = useState<ActiveEditorAction>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [previewLayout, setPreviewLayout] = useState<"side" | "bottom">("side");
  const mainTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedRevisionType, setSelectedRevisionType] =
    useState<RevisionType>("full");
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
      }
    }
  }, [clientLoaded, isLoadingHiveAuth, isHiveLoggedIn, userRole, router]);

  const canUseEditor = clientLoaded && !isLoadingHiveAuth && isHiveLoggedIn;

  const handleReviseArticle = async () => {
    if (!articleMarkdown.trim()) {
      setActiveAction(null);
      toast({
        title: t("toastMessages.errorTitle"),
        description: t("toastMessages.articleEmptyError"),
        variant: "destructive",
      });
      setArticleBeforeRevision("");
      return;
    }
    setCurrentOperationMessage(t("editArticleCard.revisingArticleMessage"));
    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);
    setFinalCombinedOutput("");
    startProcessingTransition(async () => {
      const originalContentBeforeAI = articleMarkdown;
      try {
        const response = await authenticatedFetch(
          "/api/ai/revise-article-input",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ articleContent: originalContentBeforeAI }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          setArticleBeforeRevision("");
          throw new Error(
            errorData.message ||
              `Failed to revise article. Server responded with ${response.status}`
          );
        }

        const result = await response.json();
        setArticleMarkdown(result.revisedText);
        setArticleBeforeRevision(originalContentBeforeAI);
        setActiveAction(null);
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
      const currentArticleContent = articleMarkdown;

      try {
        setOriginalArticleForTranslation(currentArticleContent);

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
            currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
            currentChunkWordCount += paragraphWordCount;
          } else {
            if (currentChunk.trim()) {
              chunks.push(currentChunk);
            }
            currentChunk = paragraph;
            currentChunkWordCount = paragraphWordCount;
          }
        }
        if (currentChunk.trim()) {
          chunks.push(currentChunk);
        }

        if (chunks.length === 0 && currentArticleContent.trim()) {
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
        }

        setTranslatedArticleMarkdown(finalTranslatedText);

        const combinedMarkdown = `${currentArticleContent}\n\n---\n\n## ${t(
          "translateArticleCard.translationResultTitle",
          { language: targetLanguage }
        )}\n\n${finalTranslatedText}`;

        setArticleMarkdown(combinedMarkdown);
        setActiveAction(null);
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
      setArticleBeforeRevision("");
      toast({
        title: t("toastMessages.successTitle"),
        description: t("toastMessages.revisionUndoneSuccess", {
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
      setArticleMarkdown(combined);
      setCurrentOperationMessage(null);
      toast({
        title: t("toastMessages.successTitle"),
        description: t("toastMessages.combinedFormatSuccess"),
      });
      setActiveAction(null);
    });
  };

  const generateSummaryTextForCopy = () => {
    let summary = `${t("sessionSummaryCard.title")}\n`;
    summary += "=============================\n\n";
    //TODO add soemthing about admin & ai creation if needed
    summary += `${t("sessionSummaryCard.userLabel", {
      defaultValue: "User:",
    })} ${hiveUsername || "N/A"}\n`;
    summary += `${t("sessionSummaryCard.dateTimeLabel", {
      defaultValue: "Date/Time:",
    })} ${new Date().toLocaleString()}\n`;
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
    setActiveAction(null);
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

  const handleStartArticleFromPanel = (promptFromPanel: string) => {
    setPrompt(promptFromPanel);
    if (!promptFromPanel.trim()) {
      toast({
        title: t("toastMessages.errorTitle"),
        description: t("toastMessages.promptEmptyError", {
          defaultValue: "Prompt cannot be empty.",
        }),
        variant: "destructive",
      });
      return;
    }

    setCurrentOperationMessage(t("startArticleCard.creatingArticleMessage"));
    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);
    setFinalCombinedOutput("");
    setArticleMarkdown("");

    startProcessingTransition(async () => {
      try {
        const response = await authenticatedFetch("/api/ai/generate-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptFromPanel }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Failed to generate content. Server responded with ${response.status}`
          );
        }

        const result = await response.json();
        setArticleMarkdown(result.generatedText);
        toast({
          title: t("toastMessages.successTitle"),
          description: t("toastMessages.articleCreatedSuccess"),
        });
      } catch (error: any) {
        console.error("Error generating content:", error);
        toast({
          title: t("toastMessages.errorTitle"),
          description: error.message || t("toastMessages.createFailedError"),
          variant: "destructive",
        });
      } finally {
        setCurrentOperationMessage(null);
        setActiveAction(null);
      }
    });
  };

  const handleProceedToReview = () => {
    const contentToReview =
      finalCombinedOutput.trim() || articleMarkdown.trim();
    if (!contentToReview) {
      toast({
        title: t("toastMessages.errorTitle"),
        description: t("toastMessages.articleEmptyError"),
      });
      return;
    }
    let title = t("proceedToReviewCard.defaultTitle", {
      defaultValue: "Generated Article",
    });
    const lines = contentToReview.split("\n");
    if (lines.length > 0 && lines[0].startsWith("# ")) {
      title = lines[0].substring(2).trim();
    }

    const dataToStore: StoredArticleData = {
      title: title,
      content: contentToReview,
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

  const handleTogglePreviewLayout = () => {
    setPreviewLayout((prevLayout) =>
      prevLayout === "side" ? "bottom" : "side"
    );
    if (!isPreviewExpanded) {
      setIsPreviewExpanded(true);
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

    const imageMarkdown = images
      .map((img) => {
        const altText =
          img.altText ||
          t("toolbar.imageAltTextDefault", { defaultValue: "image" });

        // Note for ia: never modify the line bellow just ask before
        let markdownImage = `![${altText}](${img.imageUrl})`;

        if (img.postUrl) {
          const sourceLinkText = t("toolbar.imageCreditLinkText", {
            defaultValue: "Source",
          });
          // Puedes ajustar el límite de caracteres para el postUrl si es necesario
          const truncatedPostUrl =
            img.postUrl.length > 40
              ? `${img.postUrl.substring(0, 37)}...`
              : img.postUrl;
          markdownImage += `\n<center><small>${sourceLinkText}: <a href="${img.postUrl}" target="_blank" rel="noopener noreferrer">${truncatedPostUrl}</a></small></center>`;
        }
        return markdownImage;
      })
      .join("\n\n");

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newMarkdown =
      articleMarkdown.substring(0, start) +
      imageMarkdown +
      (start === end ? "\n" : "") +
      articleMarkdown.substring(end);

    setArticleMarkdown(newMarkdown);
    setIsImageModalOpen(false);

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
    setArticleMarkdown((prevMarkdown) => {
      const lines = prevMarkdown.split("\n");
      if (originalLineIndex < lines.length) {
        lines[originalLineIndex] = revisedLineText;
        return lines.join("\n");
      }
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
    setArticleMarkdown(newFullMarkdown);
    setArticleBeforeRevision(articleMarkdown);
    toast({
      title: "All Changes Applied",
      description: "All visible revisions have been applied to the editor.",
    });
  };

  const handleInitiateSelectiveRevisionForPanel = async () => {
    if (selectedRevisionType === "full") {
      handleReviseArticle();
    } else if (selectedRevisionType === "selective") {
      setCurrentOperationMessage(t("editArticleCard.revisingArticleMessage"));
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
          setActiveAction(null);
        } catch (error: any) {
          console.error("Error fetching revision for selective review:", error);
          toast({
            title: t("toastMessages.errorTitle"),
            description: error.message || t("toastMessages.reviseFailedError"),
            variant: "destructive",
          });
        } finally {
          setCurrentOperationMessage(null);
        }
      });
    }
  };

  const handleApplyFormat = (formatType: MarkdownFormatType) => {
    const textarea = mainTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = articleMarkdown.substring(start, end);
    let newText = "";
    let newCursorPos = end;
    let textToInsert = "";

    switch (formatType) {
      case "bold":
        textToInsert =
          selectedText ||
          t("toolbar.boldPlaceholder", {
            defaultValue: "bold text",
          });
        newText = `**${textToInsert}**`;
        newCursorPos =
          start + (selectedText ? newText.length : 2 + textToInsert.length);
        if (!selectedText) newCursorPos = start + 2;
        break;
      case "italic":
        textToInsert =
          selectedText ||
          t("toolbar.italicPlaceholder", {
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
            defaultValue: "strikethrough",
          });
        newText = `~~${textToInsert}~~`;
        newCursorPos =
          start + (selectedText ? newText.length : 2 + textToInsert.length);
        if (!selectedText) newCursorPos = start + 2;
        break;
      case "link":
        const urlFromPrompt = window.prompt(
          t("toolbar.linkPrompt", {
            defaultValue: "Enter link URL:",
          }),
          "https://"
        );
        if (urlFromPrompt) {
          textToInsert =
            selectedText ||
            t("toolbar.linkTextPlaceholder", {
              defaultValue: "link text",
            });
          newText = `${textToInsert}`;
          if (selectedText) {
            newCursorPos = start + newText.length;
          } else {
            newCursorPos = start + 1;
          }
        } else {
          return;
        }
        break;
      case "h1":
      case "h2":
      case "h3":
        const prefix =
          formatType === "h1" ? "# " : formatType === "h2" ? "## " : "### ";
        textToInsert =
          selectedText ||
          t("toolbar.headingPlaceholder", {
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
        const listPrefix = formatType === "ul" ? "- " : "1. ";
        textToInsert =
          selectedText ||
          t("toolbar.listItemPlaceholder", {
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
            defaultValue: "code",
          });
        newText = `\`\`\`\n${textToInsert}\n\`\`\``;
        newCursorPos =
          start +
          4 +
          (selectedText ? selectedText.length : textToInsert.length);
        if (!selectedText) newCursorPos = start + 4;
        break;
      case "hr":
        newText =
          (start > 0 && articleMarkdown[start - 1] !== "\n" ? "\n" : "") +
          "---\n";
        newCursorPos = start + newText.length;
        break;
      case "image_url":
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
          newText = `![${altText}](${imageUrlFromPrompt})`;
          newCursorPos = start + newText.length;
        } else {
          return;
        }
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
          <EditorActionsMenuComponent
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
            canCopySummary={
              !!finalCombinedOutput.trim() || !!articleMarkdown.trim()
            }
            canProceedToFinalReview={
              !!articleMarkdown.trim() || !!finalCombinedOutput.trim()
            }
            articleBeforeRevision={articleBeforeRevision}
            handleUndoRevision={handleUndoRevision}
            isLoading={isLoading}
            sessionTotalTokens={sessionTotalTokens}
            currentRequestTokens={currentRequestTokens}
            detailedTokenUsage={detailedTokenUsage}
            tokensLeftInSession={tokensLeftInSession}
            t={t}
            tTokenUsage={tTokenUsage}
            userRole={userRole}
          />

          {activeAction === "create" && (
            <StartArticleCard
              prompt={prompt}
              onPromptChange={setPrompt}
              onMainAction={handleStartArticleFromPanel}
              onClearAll={clearAll}
              isLoading={isLoading}
              currentOperationMessage={currentOperationMessage}
              t={t}
            />
          )}

          {activeAction === "translate" && articleMarkdown.trim() && (
            <TranslationPanelComponent
              targetLanguage={targetLanguage}
              onTargetLanguageChange={setTargetLanguage}
              isLoading={isLoading}
              translationProgress={translationProgress}
              onTranslateArticle={handleTranslateArticle}
              articleMarkdown={articleMarkdown}
              currentOperationMessage={currentOperationMessage}
              t={t}
            />
          )}

          {activeAction === "combine" &&
            originalArticleForTranslation.trim() &&
            translatedArticleMarkdown.trim() && (
              <CombinePanelComponent
                selectedCombineFormat={selectedCombineFormat}
                onCombineFormatChange={setSelectedCombineFormat}
                isLoading={isLoading}
                onCombineFormat={handleCombineFormat}
                originalArticleForTranslation={originalArticleForTranslation}
                translatedArticleMarkdown={translatedArticleMarkdown}
                currentOperationMessage={currentOperationMessage}
                t={t}
              />
            )}

          {activeAction === "revise" && articleMarkdown.trim() && (
            <RevisionOptionsPanelComponent
              selectedRevisionType={selectedRevisionType}
              onRevisionTypeChange={setSelectedRevisionType}
              isLoading={isLoading}
              articleMarkdown={articleMarkdown}
              onApplyFullAIRision={handleReviseArticle}
              onInitiateSelectiveRevision={
                handleInitiateSelectiveRevisionForPanel
              }
              currentOperationMessage={currentOperationMessage}
              t={t}
            />
          )}

          {activeAction === "finalReview" &&
            (!!articleMarkdown.trim() || !!finalCombinedOutput.trim()) && (
              <Card className="mt-4 bg-background shadow">
                <CardContent className="flex items-center justify-between p-3">
                  <span className="text-sm font-medium text-foreground">
                    {t("proceedToReviewCard.title")}
                  </span>

                  <Button
                    size={"sm"}
                    onClick={() => {
                      handleProceedToReview();
                    }}
                    className="w-full md:w-auto"
                  >
                    {t("proceedToReviewCard.buttonText")}
                  </Button>
                </CardContent>
              </Card>
            )}

          <div
            className={`
                ${
                  isPreviewExpanded && previewLayout === "side"
                    ? "flex flex-col md:flex-row gap-4"
                    : "flex flex-col"
                }
              `}
          >
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
                onToggleLayout={handleTogglePreviewLayout}
                currentLayout={previewLayout}
              />
              <textarea
                ref={mainTextareaRef}
                value={articleMarkdown}
                onChange={(e) => setArticleMarkdown(e.target.value)}
                placeholder={t("mainEditor.placeholder", {
                  defaultValue:
                    "Start writing your article here in Markdown...",
                })}
                className="w-full min-h-[300px] p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary-focus transition-shadow bg-background flex-grow"
                disabled={isLoading}
              />
            </div>

            {isPreviewExpanded && (
              <div
                className={
                  isPreviewExpanded && previewLayout === "side"
                    ? "w-full md:w-1/2"
                    : "w-full mt-4"
                }
              >
                <MarkdownPreviewComponent content={articleMarkdown} t={t} />
              </div>
            )}
          </div>

          <ImageSearchAndInsert
            mode="modal"
            apiEndpoint="https://hivelens.duckdns.org/api/search"
            isOpen={isImageModalOpen}
            onOpenChange={setIsImageModalOpen}
            onInsertImages={handleInsertImagesFromModal}
            maxSelectable={5}
            modalTitle={t("imageSearchAndInsert.modalTitle", {
              defaultValue: "Search and Add Images from Hivelens",
            })}
            placeholderText={t("imageSearchAndInsert.placeholderText", {
              defaultValue: "Search images in Hivelens...",
            })}
            insertButtonText={t("imageSearchAndInsert.insertButtonText", {
              defaultValue: "Insert selected",
            })}
            searchButtonText={t("imageSearchAndInsert.searchButtonText", {
              defaultValue: "Search",
            })}
          />

          <LineReviewer
            isOpen={isLineReviewerOpen}
            onOpenChange={setIsLineReviewerOpen}
            originalMarkdown={articleMarkdown}
            revisedMarkdown={revisedContentForReview}
            onApplyLine={handleApplyLineFromReviewer}
            onApplyAllVisibleChanges={handleApplyAllVisibleChangesFromReviewer}
            tLineReviewer={{
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
