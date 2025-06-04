"use client";

import { ImageSearchAndInsert } from "@/components/custom/ImageSearchAndInsert";
import { CombinePanelComponent } from "@/components/editor-page/CombinePanelComponent";
import { EditorActionsMenuComponent } from "@/components/editor-page/EditorActionsMenuComponent";
import { MainEditorArea } from "@/components/editor-page/MainEditorArea";
import { RevisionOptionsPanelComponent } from "@/components/editor-page/RevisionOptionsPanelComponent";
import { TranslationPanelComponent } from "@/components/editor-page/TranslationPanelComponent";
import { LineReviewer } from "@/components/editor-sections/LineReviewer";
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
  VOICE_COMMANDS,
} from "@/constants/constants";
import { useArticleCreation } from "@/hooks/use-article-creation";
import { useArticleRevision } from "@/hooks/use-article-revision";
import { useArticleTranslation } from "@/hooks/use-article-translation";
import { useBrowserDetection } from "@/hooks/use-browser-detection";
import { useHiveAuth } from "@/hooks/use-hive-auth";
import { useToast } from "@/hooks/use-toast";
import { useVoiceControl } from "@/hooks/use-voice-control";
import {
  ActiveEditorAction,
  CombineFormatType,
  LanguageCode,
  StoredArticleData,
} from "@/types/general.types";
import { getLocaleFromLanguageValue } from "@/utils/language";
import { splitMarkdownIntoParagraphs } from "@/utils/markdown";
import {
  getGenerateSummaryTextForCopy,
  getToolbarFormatStrings,
} from "@/utils/markdown-editor-utils";
import { Mic, MicOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

export default function ArticleForgePage() {
  const t = useTranslations("ArticleForgePage");
  const tTokenUsage = useTranslations("TokenUsage");
  const tMarkdownToolBar = useTranslations("MarkdownToolbar");
  const router = useRouter();

  const currentLocale = useLocale();

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

  const [clientLoaded, setClientLoaded] = useState(false);

  const [isPreviewExpanded, setIsPreviewExpanded] = useState<boolean>(false);
  const [activeAction, setActiveAction] = useState<ActiveEditorAction>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [previewLayout, setPreviewLayout] = useState<"side" | "bottom">("side");
  const mainTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);

  const { toast } = useToast();

  const [voiceInputState, setVoiceInputState] = useState<
    "idle" | "awaiting_heading_title"
  >("idle");

  const {
    translatedArticleMarkdown,
    originalArticleForTranslation,
    translationProgress,
    isTranslating,
    translationError,
    translateArticle,
  } = useArticleTranslation({
    authenticatedFetch,
    articleMarkdown,
    targetLanguage,
    setCurrentOperationMessage,
    translatingChunkMessage: (values) =>
      t("translateArticleCard.translatingChunkMessage", values),
    translateFailedErrorMessage: t("toastMessages.translateFailedError"),
  });

  const { createArticle, isCreating: isCreatingArticle } = useArticleCreation({
    authenticatedFetch,
  });

  const [isProcessing, startProcessingTransition] = useTransition();

  const {
    articleBeforeRevision,
    selectedRevisionType,
    setSelectedRevisionType,
    isLineReviewerOpen,
    setIsLineReviewerOpen,
    revisedContentForReview,
    setRevisedContentForReview,
    includeTagSuggestions,
    setIncludeTagSuggestions,
    aiGeneratedTags,
    setAiGeneratedTags,
    isRevising,
    revisionError,
    handleReviseArticle: reviseArticleHook,
    handleUndoRevision: undoRevisionHook,
  } = useArticleRevision({
    authenticatedFetch,
    articleMarkdown,
    setArticleMarkdown,
    setCurrentOperationMessage,
    revisingArticleMessage: t("editArticleCard.revisingArticleMessage"),
    reviseFailedError: t("toastMessages.reviseFailedError"),
    articleRevisedSuccess: t("toastMessages.articleRevisedSuccess"),
    revisionUndoneSuccess: t("toastMessages.revisionUndoneSuccess", {
      defaultValue: "Revision undone successfully.",
    }),
    articleEmptyError: t("toastMessages.articleEmptyError"),
  });

  const isLoading =
    isProcessing || isLoadingHiveAuth || isTranslating || isRevising;
  const isLoadingCreation = isCreatingArticle;

  const { isChrome: isChromeBrowser, isBrave: isBraveBrowser } =
    useBrowserDetection();

  useEffect(() => {
    setClientLoaded(true);
  }, []);

  const mapLocaleToSpeechLang = useCallback((locale: string): string => {
    const lang = locale.toLowerCase() as LanguageCode;
    const mapping: Record<LanguageCode, string> = {
      en: "en-US",
      es: "es-ES",
      fr: "fr-FR",
      "pt-br": "pt-BR",
    };
    return mapping[lang] || "en-US";
  }, []);

  const speechLanguage = mapLocaleToSpeechLang(currentLocale);

  const handleVoiceCommand = (commandAction: string) => {
    const textarea = mainTextareaRef.current;
    let textToInsertAtCursor: string | null = null;
    let newVoiceState: typeof voiceInputState | null = null;

    let finalMarkdown = articleMarkdown;
    let finalSelectionStart =
      textarea?.selectionStart ?? articleMarkdown.length;
    let finalSelectionEnd = textarea?.selectionEnd ?? articleMarkdown.length;
    let needsTextareaFocus = false;

    switch (commandAction) {
      case "CMD_HEADING_2":
        textToInsertAtCursor = "## ";
        newVoiceState = "awaiting_heading_title";
        break;
      case "CMD_NEW_LINE":
        textToInsertAtCursor = "\n";
        newVoiceState = "idle";
        break;
      case "CMD_PERIOD":
        finalMarkdown = articleMarkdown.trimEnd() + ". ";
        finalSelectionStart = finalMarkdown.length;
        finalSelectionEnd = finalMarkdown.length;
        newVoiceState = "idle";
        break;
    }

    if (textToInsertAtCursor) {
      const currentCursorPos =
        textarea?.selectionStart ?? articleMarkdown.length;
      const selectionEndForInsert = textarea?.selectionEnd ?? currentCursorPos;

      finalMarkdown =
        articleMarkdown.substring(0, currentCursorPos) +
        textToInsertAtCursor +
        articleMarkdown.substring(selectionEndForInsert);

      finalSelectionStart = currentCursorPos + textToInsertAtCursor.length;
      finalSelectionEnd = finalSelectionStart;
    }

    if (newVoiceState) {
      setVoiceInputState(newVoiceState);
    }

    if (finalMarkdown !== articleMarkdown || textToInsertAtCursor) {
      setArticleMarkdown(finalMarkdown);
      needsTextareaFocus = true;
    }

    if (needsTextareaFocus && textarea) {
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = finalSelectionStart;
        textarea.selectionEnd = finalSelectionEnd;
      }, 0);
    }
  };

  const {
    isListening: isVoiceListening,
    isSupported: isVoiceSupported,
    error: voiceError,
    toggleListening: toggleVoiceListening,
    setLanguage: setVoiceLanguage,
  } = useVoiceControl({
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        const textarea = mainTextareaRef.current;
        let currentSelectionStart =
          textarea?.selectionStart ?? articleMarkdown.length;
        let currentSelectionEnd =
          textarea?.selectionEnd ?? articleMarkdown.length;

        const textToInsert =
          voiceInputState === "awaiting_heading_title" ? text : text + " ";

        const newArticleMarkdown =
          articleMarkdown.substring(0, currentSelectionStart) +
          textToInsert +
          articleMarkdown.substring(currentSelectionEnd);

        const newCursorPos = currentSelectionStart + textToInsert.length;

        setArticleMarkdown(newArticleMarkdown);

        if (voiceInputState === "awaiting_heading_title") {
          setVoiceInputState("idle");
        }

        if (textarea) {
          setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = newCursorPos;
            textarea.selectionEnd = newCursorPos;
          }, 0);
        }
      }
    },
    initialLanguage: speechLanguage,
    commands: VOICE_COMMANDS,
    onCommand: handleVoiceCommand,
  });

  useEffect(() => {
    setVoiceLanguage(speechLanguage);
  }, [speechLanguage, setVoiceLanguage]);

  useEffect(() => {
    if (clientLoaded && !isLoadingHiveAuth) {
      if (!isHiveLoggedIn) {
        router.push("/login");
      }
    }
  }, [clientLoaded, isLoadingHiveAuth, isHiveLoggedIn, userRole, router]);

  const canUseEditor = clientLoaded && !isLoadingHiveAuth && isHiveLoggedIn;

  const handleReviseArticle = () => {
    if (!articleMarkdown.trim()) {
      toast({
        title: t("toastMessages.errorTitle"),
        description: t("toastMessages.articleEmptyError"),
        variant: "destructive",
      });
      return;
    }
    setFinalCombinedOutput("");

    startProcessingTransition(async () => {
      try {
        const revisionResult = await reviseArticleHook();

        if (revisionResult.success) {
          setActiveAction(null);
          toast({
            title: t("toastMessages.successTitle"),
            description: t("toastMessages.articleRevisedSuccess"),
          });
        } else {
          toast({
            title: t("toastMessages.errorTitle"),
            description:
              revisionResult.error?.message ||
              t("toastMessages.reviseFailedError"),
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error during article revision process:", error);
        toast({
          title: t("toastMessages.errorTitle"),
          description: error.message || t("toastMessages.reviseFailedError"),
          variant: "destructive",
        });
      }
    });
  };

  useEffect(() => {
    if (revisionError) {
      console.error("Revision Error:", revisionError);
      toast({
        title: t("toastMessages.errorTitle"),
        description:
          revisionError.message || t("toastMessages.reviseFailedError"),
        variant: "destructive",
      });
    }
  }, [revisionError, toast, t]);

  const handleUndoRevision = () => {
    const undoResult = undoRevisionHook();
    if (undoResult.success) {
      toast({
        title: t("toastMessages.successTitle"),
        description: undoResult.message,
      });
    } else {
      // No hay nada que deshacer, el hook ya lo maneja
      // Podrías mostrar un toast aquí si el hook no lo hace
    }
  };

  const handleTranslateArticle = () => {
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

    setFinalCombinedOutput("");
    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);

    startProcessingTransition(async () => {
      try {
        const translationResult = await translateArticle();

        if (
          translationResult.success &&
          translationResult.originalText &&
          translationResult.translatedText
        ) {
          const combinedMarkdown = `${
            translationResult.originalText
          }\n\n---\n\n## ${t("translateArticleCard.translationResultTitle", {
            language: targetLanguage,
          })}\n\n${translationResult.translatedText}`;
          setArticleMarkdown(combinedMarkdown);
          setActiveAction(null);
          toast({
            title: t("toastMessages.successTitle"),
            description: t("toastMessages.articleTranslatedSuccess", {
              targetLanguage,
            }),
          });
        } else {
          const errorMessage =
            translationResult.error?.message ||
            t("toastMessages.translateFailedError");
          toast({
            title: t("toastMessages.errorTitle"),
            description: errorMessage,
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error during article translation process:", error);
        toast({
          title: t("toastMessages.errorTitle"),
          description: error.message || t("toastMessages.translateFailedError"),
          variant: "destructive",
        });
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

  const handleCopySummary = () => {
    startProcessingTransition(async () => {
      setCurrentOperationMessage(
        t("sessionSummaryCard.preparingSummaryMessage")
      );
      const summaryText = getGenerateSummaryTextForCopy(
        t,
        hiveUsername!,
        userRole!,
        detectedLanguage!,
        sessionTotalTokens,
        sessionTextTokensUsed,
        sessionImageTokensUsed,
        finalCombinedOutput
      );
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
        const result = await createArticle({ prompt: promptFromPanel });

        if (result && result.generatedText) {
          setArticleMarkdown(result.generatedText);
          toast({
            title: t("toastMessages.successTitle"),
            description: t("toastMessages.articleCreatedSuccess"),
          });
        } else {
          throw new Error(t("toastMessages.createFailedError"));
        }
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
      ...(aiGeneratedTags.length > 0 && {
        suggestedTags: aiGeneratedTags,
      }),
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
          t("toolbar.aiImageAltTextDefault", { defaultValue: "image" });

        let markdownImage = `![${altText}](${img.imageUrl})`;

        if (img.postUrl) {
          const sourceLinkText = t("toolbar.imageCreditLinkText", {
            defaultValue: "Source",
          });
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
              body: JSON.stringify({
                articleContent: articleMarkdown,
                ...(includeTagSuggestions && {
                  taskType: "revise_and_suggest_tags",
                }),
              }),
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
          if (result.suggestedTags && result.suggestedTags.length > 0) {
            setAiGeneratedTags(result.suggestedTags);
          }
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

  const handleAIImageGenerated = (imageUrl: string, altText?: string) => {
    const textarea = mainTextareaRef.current;
    if (!textarea) return;

    const effectiveAltText =
      altText ||
      t("toolbar.aiImageAltTextDefault", {
        defaultValue: "AI Generated Image",
      });

    const imageMarkdownPart = `![${effectiveAltText}](${imageUrl})`;

    const attributionText = "gemini-AI";
    const attributionLinkMarkdown = `<center><small>${attributionText}</small></center>`;

    const fullMarkdownToInsert = `${imageMarkdownPart}\n${attributionLinkMarkdown}`;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newMarkdown =
      articleMarkdown.substring(0, start) +
      fullMarkdownToInsert +
      (start === end ? "\n" : "") +
      articleMarkdown.substring(end);

    setArticleMarkdown(newMarkdown);

    setTimeout(() => {
      textarea.focus();
      const newCursorPosition = start + fullMarkdownToInsert.length;
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);

    toast({
      title: t("toastMessages.successTitle"),
      description: t("toastMessages.aiImageInsertedSuccess", {
        defaultValue: "AI generated image inserted.",
      }),
    });
  };

  const handleTriggerDeviceImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];

        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: t("toastMessages.errorTitle"),
            description: t("toastMessages.fileTooLargeError", {
              maxSize: "5MB",
            }),
            variant: "destructive",
          });
          return;
        }

        setCurrentOperationMessage(
          t("toastMessages.uploadingImageMessage", {
            defaultValue: "Uploading image...",
          })
        );
        startProcessingTransition(async () => {
          try {
            const formData = new FormData();
            formData.append("image", file);

            const response = await authenticatedFetch("/api/images/upload", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(
                errorData.error ||
                  errorData.message ||
                  `Failed to upload image. Server responded with ${response.status}`
              );
            }

            const result = await response.json();
            if (result.data && result.data.image_url) {
              const altText =
                file.name.split(".")[0] ||
                t("toolbar.uploadedImageAltTextDefault", {
                  defaultValue: "uploaded image",
                });
              const imageMarkdown = `![${altText}](${result.data.image_url})`;

              const textarea = mainTextareaRef.current;
              if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newMarkdown =
                  articleMarkdown.substring(0, start) +
                  imageMarkdown +
                  (start === end ? "\n" : "") +
                  articleMarkdown.substring(end);
                setArticleMarkdown(newMarkdown);
                setTimeout(() => {
                  textarea.focus();
                  textarea.setSelectionRange(
                    start + imageMarkdown.length,
                    start + imageMarkdown.length
                  );
                }, 0);
              }
              toast({
                title: t("toastMessages.successTitle"),
                description: t("toastMessages.imageUploadedSuccess"),
              });
            } else {
              throw new Error(t("toastMessages.uploadInvalidResponseError"));
            }
          } catch (error: any) {
            console.error("Error uploading image:", error);
            toast({
              title: t("toastMessages.errorTitle"),
              description:
                error.message || t("toastMessages.uploadFailedError"),
              variant: "destructive",
            });
          } finally {
            setCurrentOperationMessage(null);
          }
        });
      }
    };
    input.click();
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
              isLoading={isLoadingCreation}
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
              includeTagSuggestions={includeTagSuggestions}
              onIncludeTagSuggestionsChange={setIncludeTagSuggestions}
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

          <MainEditorArea
            articleMarkdown={articleMarkdown}
            onArticleMarkdownChange={setArticleMarkdown}
            isLoading={isLoading}
            isPreviewExpanded={isPreviewExpanded}
            previewLayout={previewLayout}
            onToggleLayout={handleTogglePreviewLayout}
            onToggleImageModal={handleToggleImageModal}
            onAIImageGenerated={handleAIImageGenerated}
            onTriggerDeviceImageUpload={handleTriggerDeviceImageUpload}
            mainTextareaRef={mainTextareaRef}
            editorPlaceholder={t("mainEditor.placeholder", {
              defaultValue: "Start writing your article here in Markdown...",
            })}
            previewTitle={t("markdownPreview.title", {
              defaultValue: "Markdown Preview",
            })}
            tMarkdownToolBar={tMarkdownToolBar}
            toolbarFormatStrings={getToolbarFormatStrings(t)}
          />

          <ImageSearchAndInsert
            mode="modal"
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

      {canUseEditor && isVoiceSupported && isChromeBrowser && (
        <div
          className="fixed flex flex-col items-center space-y-1"
          style={{
            top: "calc(1rem + 20px)",
            left: "20px",
            zIndex: 50,
          }}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={toggleVoiceListening}
            title={
              isVoiceListening ? "Detener dictado" : "Iniciar dictado por voz"
            }
            className={`rounded-full shadow-lg ${
              isVoiceListening
                ? "ring-2 ring-red-500 text-red-500"
                : "bg-background hover:bg-muted"
            }`}
          >
            {isVoiceListening ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
          {voiceError && !isBraveBrowser && (
            <p className="text-xs text-destructive bg-background/80 px-2 py-1 rounded shadow-md max-w-[150px] text-center">
              {voiceError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
