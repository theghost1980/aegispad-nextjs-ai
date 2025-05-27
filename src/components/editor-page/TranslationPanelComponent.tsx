"use client";

import LoadingSpinner from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AVAILABLE_LANGUAGES } from "@/constants/constants";
import { ArticleForgePageTranslations } from "@/types/translation-types";
import { Languages } from "lucide-react";
import React from "react";

interface TranslationPanelComponentProps {
  targetLanguage: string;
  onTargetLanguageChange: (value: string) => void;
  isLoading: boolean;
  translationProgress: { current: number; total: number } | null;
  onTranslateArticle: () => void;
  articleMarkdown: string;
  currentOperationMessage: string | null;
  t: ArticleForgePageTranslations;
}

export const TranslationPanelComponent: React.FC<
  TranslationPanelComponentProps
> = ({
  targetLanguage,
  onTargetLanguageChange,
  isLoading,
  translationProgress,
  onTranslateArticle,
  articleMarkdown,
  currentOperationMessage,
  t,
}) => (
  <Card className="mt-4 bg-muted/40 shadow">
    <CardContent className="flex items-center gap-3 p-3">
      <select
        value={targetLanguage}
        onChange={(e) => onTargetLanguageChange(e.target.value)}
        className="flex-grow p-2 border rounded-md bg-background text-sm"
        disabled={isLoading}
      >
        {AVAILABLE_LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
      {translationProgress && isLoading && (
        <div className="text-sm text-muted-foreground">
          {t("translateArticleCard.translatingChunkMessage", {
            current: translationProgress.current,
            total: translationProgress.total,
          })}
        </div>
      )}
      <Button
        onClick={onTranslateArticle}
        disabled={
          isLoading || !articleMarkdown.trim() || !targetLanguage.trim()
        }
        size="sm"
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
          <Languages className="mr-2 h-4 w-4" />
        )}
        {t("translateArticleCard.translateButton")}
      </Button>
    </CardContent>
  </Card>
);
