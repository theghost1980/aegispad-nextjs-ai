import { AuthenticatedFetch, RevisionType } from "@/types/general.types";
import { useCallback, useState } from "react";

interface UseArticleRevisionProps {
  authenticatedFetch: AuthenticatedFetch;
  articleMarkdown: string;
  setArticleMarkdown: (markdown: string) => void;
  setCurrentOperationMessage: (message: string | null) => void;
  revisingArticleMessage: string;
  reviseFailedError: string;
  articleRevisedSuccess: string;
  revisionUndoneSuccess: string;
  articleEmptyError: string;
}

export const useArticleRevision = ({
  authenticatedFetch,
  articleMarkdown,
  setArticleMarkdown,
  setCurrentOperationMessage,
  revisingArticleMessage,
  reviseFailedError,
  articleRevisedSuccess,
  revisionUndoneSuccess,
  articleEmptyError,
}: UseArticleRevisionProps) => {
  const [articleBeforeRevision, setArticleBeforeRevision] =
    useState<string>("");
  const [selectedRevisionType, setSelectedRevisionType] =
    useState<RevisionType>("full");
  const [isLineReviewerOpen, setIsLineReviewerOpen] = useState(false);
  const [revisedContentForReview, setRevisedContentForReview] =
    useState<string>("");
  const [includeTagSuggestions, setIncludeTagSuggestions] =
    useState<boolean>(false);
  const [aiGeneratedTags, setAiGeneratedTags] = useState<string[]>([]);
  const [isRevising, setIsRevising] = useState(false);
  const [revisionError, setRevisionError] = useState<Error | null>(null);

  const handleReviseArticle = useCallback(async () => {
    if (!articleMarkdown.trim()) {
      setRevisionError(new Error(articleEmptyError));
      return { success: false, error: new Error(articleEmptyError) };
    }

    setIsRevising(true);
    setRevisionError(null);
    setCurrentOperationMessage(revisingArticleMessage);
    setAiGeneratedTags([]);

    const originalContentBeforeAI = articleMarkdown;
    setArticleBeforeRevision(originalContentBeforeAI);

    try {
      const response = await authenticatedFetch(
        "/api/ai/revise-article-input",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            articleContent: originalContentBeforeAI,
            ...(includeTagSuggestions && {
              taskType: "revise_and_suggest_tags",
            }),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to revise article. Server responded with ${response.status}`
        );
      }

      const result = await response.json();
      setArticleMarkdown(result.revisedText);
      if (result.suggestedTags && result.suggestedTags.length > 0) {
        setAiGeneratedTags(result.suggestedTags);
      }
      return {
        success: true,
        revisedText: result.revisedText,
        suggestedTags: result.suggestedTags,
      };
    } catch (e: any) {
      console.error("Error revising article:", e);
      setRevisionError(e);
      setArticleBeforeRevision("");
      return { success: false, error: e };
    } finally {
      setIsRevising(false);
      setCurrentOperationMessage(null);
    }
  }, [
    authenticatedFetch,
    articleMarkdown,
    setArticleMarkdown,
    setCurrentOperationMessage,
    revisingArticleMessage,
    includeTagSuggestions,
    articleEmptyError,
  ]);

  const handleUndoRevision = useCallback(() => {
    if (articleBeforeRevision) {
      setArticleMarkdown(articleBeforeRevision);
      setArticleBeforeRevision("");
      return { success: true, message: revisionUndoneSuccess };
    }
    return { success: false, message: "No revision to undo" };
  }, [articleBeforeRevision, setArticleMarkdown, revisionUndoneSuccess]);

  return {
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
    handleReviseArticle,
    handleUndoRevision,
  };
};
