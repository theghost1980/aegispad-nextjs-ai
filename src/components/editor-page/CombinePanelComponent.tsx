"use client";

import LoadingSpinner from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CombineFormatType } from "@/types/general.types";
import { ArticleForgePageTranslations } from "@/types/translation-types";
import React from "react";

interface CombinePanelComponentProps {
  selectedCombineFormat: CombineFormatType;
  onCombineFormatChange: (value: CombineFormatType) => void;
  isLoading: boolean;
  onCombineFormat: () => void;
  originalArticleForTranslation: string;
  translatedArticleMarkdown: string;
  currentOperationMessage: string | null;
  t: ArticleForgePageTranslations;
}

export const CombinePanelComponent: React.FC<CombinePanelComponentProps> = ({
  selectedCombineFormat,
  onCombineFormatChange,
  isLoading,
  onCombineFormat,
  originalArticleForTranslation,
  translatedArticleMarkdown,
  currentOperationMessage,
  t,
}) => (
  <Card className="mt-4 bg-muted/40 shadow">
    <CardContent className="flex items-center gap-3 p-3">
      <select
        value={selectedCombineFormat}
        onChange={(e) =>
          onCombineFormatChange(e.target.value as CombineFormatType)
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
        onClick={onCombineFormat}
        disabled={
          isLoading ||
          !originalArticleForTranslation.trim() ||
          !translatedArticleMarkdown.trim()
        }
        size="sm"
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
