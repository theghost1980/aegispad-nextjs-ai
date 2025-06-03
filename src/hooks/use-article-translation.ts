import {
  LANGUAGE_TO_LOCALE_MAP,
  MAX_WORDS_PER_CHUNK,
} from "@/constants/constants";
import { AuthenticatedFetch } from "@/types/general.types";
import { splitMarkdownIntoParagraphs } from "@/utils/markdown";
import { countWords } from "@/utils/text";
import { useCallback, useState } from "react";

interface UseArticleTranslationProps {
  authenticatedFetch: AuthenticatedFetch;
  articleMarkdown: string;
  targetLanguage: string;
  setCurrentOperationMessage: (message: string | null) => void;
  translatingChunkMessage: (values: {
    current: number;
    total: number;
  }) => string;
  translateFailedErrorMessage: string;
}

export const useArticleTranslation = ({
  authenticatedFetch,
  articleMarkdown,
  targetLanguage,
  setCurrentOperationMessage,
  translatingChunkMessage,
  translateFailedErrorMessage,
}: UseArticleTranslationProps) => {
  const [translatedArticleMarkdown, setTranslatedArticleMarkdown] =
    useState<string>("");
  const [originalArticleForTranslation, setOriginalArticleForTranslation] =
    useState<string>("");
  const [translationProgress, setTranslationProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<Error | null>(null);

  const translateArticle = useCallback(async (): Promise<{
    success: boolean;
    translatedText: string | null;
    originalText: string | null;
    error?: Error;
  }> => {
    setIsTranslating(true);
    setTranslationError(null);
    setTranslatedArticleMarkdown("");
    setOriginalArticleForTranslation("");
    setTranslationProgress(null);

    const currentArticleContent = articleMarkdown;
    setOriginalArticleForTranslation(currentArticleContent);

    try {
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
          translatingChunkMessage({ current: i + 1, total: chunks.length })
        );
        setTranslationProgress({ current: i + 1, total: chunks.length });

        const targetLocale =
          LANGUAGE_TO_LOCALE_MAP[targetLanguage.toLowerCase()];

        if (!targetLocale) {
          throw new Error(`Unsupported target language: ${targetLanguage}`);
        }
        console.log({ targetLocale }); //TODO REM

        const response = await authenticatedFetch("/api/ai/translate-article", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleContent: chunkToTranslate,
            targetLanguage: targetLocale,
          }),
        });

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
      return {
        success: true,
        translatedText: finalTranslatedText,
        originalText: currentArticleContent,
      };
    } catch (e: any) {
      console.error("Error in translation process:", e);
      setTranslationError(e);
      return {
        success: false,
        translatedText: null,
        originalText: currentArticleContent,
        error: e,
      };
    } finally {
      setIsTranslating(false);
      setCurrentOperationMessage(null);
      setTranslationProgress(null);
    }
  }, [
    authenticatedFetch,
    articleMarkdown,
    targetLanguage,
    setCurrentOperationMessage,
    translatingChunkMessage,
    translateFailedErrorMessage,
  ]);

  return {
    translatedArticleMarkdown,
    originalArticleForTranslation,
    translationProgress,
    isTranslating,
    translationError,
    translateArticle,
  };
};
