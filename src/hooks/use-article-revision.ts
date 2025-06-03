import { AuthenticatedFetch, RevisionType } from "@/types/general.types";
import { useCallback, useState } from "react";

interface UseArticleRevisionProps {
  authenticatedFetch: AuthenticatedFetch;
  articleMarkdown: string; // El contenido actual del editor
  setArticleMarkdown: (markdown: string) => void; // Para actualizar el editor principal
  setCurrentOperationMessage: (message: string | null) => void; // Para mensajes de operación globales
  // Textos traducidos necesarios para los mensajes y toasts del hook
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
      // La validación de artículo vacío se puede hacer en el componente padre
      // antes de llamar a este hook, o aquí si el hook es el único punto de entrada.
      // Por ahora, la mantenemos aquí para encapsular la lógica.
      setRevisionError(new Error(articleEmptyError));
      return { success: false, error: new Error(articleEmptyError) };
    }

    setIsRevising(true);
    setRevisionError(null);
    setCurrentOperationMessage(revisingArticleMessage);
    setAiGeneratedTags([]); // Limpiar tags anteriores

    const originalContentBeforeAI = articleMarkdown;
    setArticleBeforeRevision(originalContentBeforeAI); // Guardar antes de la revisión

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
      setArticleMarkdown(result.revisedText); // Actualizar el editor principal
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
      setArticleBeforeRevision(""); // Limpiar si falla
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
      setArticleBeforeRevision(""); // Limpiar el estado de "antes de la revisión"
      return { success: true, message: revisionUndoneSuccess };
    }
    return { success: false, message: "No revision to undo" }; // O un mensaje de error traducido
  }, [articleBeforeRevision, setArticleMarkdown, revisionUndoneSuccess]);

  // La lógica para iniciar la revisión selectiva (abrir el LineReviewer)
  // puede permanecer en page.tsx o ser parte de este hook si se desea.
  // Si se mueve aquí, necesitaría manejar el estado isLineReviewerOpen y revisedContentForReview.
  // Por ahora, solo movemos la lógica de la llamada API de revisión completa.
  // handleInitiateSelectiveRevisionForPanel necesitará ser adaptada para usar este hook.

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
