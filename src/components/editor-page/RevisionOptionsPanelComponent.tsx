"use client";

import LoadingSpinner from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RevisionType } from "@/types/general.types";
import { ArticleForgePageTranslations } from "@/types/translation-types";
import { Edit3 } from "lucide-react";
import React from "react";

interface RevisionOptionsPanelComponentProps {
  selectedRevisionType: RevisionType;
  onRevisionTypeChange: (value: RevisionType) => void;
  isLoading: boolean;
  articleMarkdown: string;
  onApplyFullAIRision: () => void;
  onInitiateSelectiveRevision: () => void;
  currentOperationMessage: string | null;
  t: ArticleForgePageTranslations;
}

export const RevisionOptionsPanelComponent: React.FC<
  RevisionOptionsPanelComponentProps
> = ({
  selectedRevisionType,
  onRevisionTypeChange,
  isLoading,
  articleMarkdown,
  onApplyFullAIRision,
  onInitiateSelectiveRevision,
  currentOperationMessage,
  t,
}) => {
  const handleApplyRevision = () => {
    if (selectedRevisionType === "full") {
      onApplyFullAIRision();
    } else if (selectedRevisionType === "selective") {
      onInitiateSelectiveRevision();
    }
  };

  return (
    <Card className="mt-4 bg-muted/40 shadow">
      <CardContent className="flex items-center gap-3 p-3">
        <select
          value={selectedRevisionType}
          onChange={(e) => onRevisionTypeChange(e.target.value as RevisionType)}
          className="flex-grow p-2 border rounded-md bg-background text-sm"
          disabled={isLoading}
        >
          <option value="full">
            {t("revisionOptionsPanel.optionFullAI", {
              defaultValue: "Full AI Revision (with Undo)",
            })}
          </option>
          <option value="selective">
            {t("revisionOptionsPanel.optionSelective", {
              defaultValue: "Let me decide what to apply (Show Diff)",
            })}
          </option>
        </select>
        <Button
          onClick={handleApplyRevision}
          disabled={isLoading || !articleMarkdown.trim()}
          size="sm"
        >
          {isLoading &&
          currentOperationMessage ===
            t("editArticleCard.revisingArticleMessage") ? (
            <LoadingSpinner size={16} className="mr-2" />
          ) : (
            <Edit3 className="mr-2 h-4 w-4" />
          )}
          {t("revisionOptionsPanel.applyButton", {
            defaultValue: "Apply Revision",
          })}
        </Button>
      </CardContent>
    </Card>
  );
};
