import { AuthenticatedFetch } from "@/types/general.types";
import { useCallback, useState } from "react";

interface CreateArticleParams {
  prompt: string;
}

export interface ArticleCreationResult {
  generatedText: string;
}

interface UseArticleCreationProps {
  authenticatedFetch: AuthenticatedFetch;
}

export const useArticleCreation = ({
  authenticatedFetch,
}: UseArticleCreationProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState<Error | null>(null);

  const createArticle = useCallback(
    async (
      params: CreateArticleParams
    ): Promise<ArticleCreationResult | null> => {
      setIsCreating(true);
      setCreationError(null);
      try {
        const response = await authenticatedFetch("/api/ai/generate-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: params.prompt }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `API error: ${response.status}`);
        }
        return (await response.json()) as ArticleCreationResult;
      } catch (e: any) {
        setCreationError(e);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [authenticatedFetch]
  );

  return { createArticle, isCreating, creationError };
};
