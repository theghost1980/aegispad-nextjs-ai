"use client";

import EditorTokenUsage from "@/components/editor-sections/EditorTokenUsage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ESTIMATED_INITIAL_SESSION_TOKENS } from "@/constants/constants";
import { ActiveEditorAction } from "@/types/general.types";
import {
  ArticleForgePageTranslations,
  TokenUsageTranslations,
} from "@/types/translation-types";
import {
  Bot,
  Coins,
  Combine,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  Languages,
  SendToBack,
  Trash2,
  Undo2,
} from "lucide-react";
import React from "react";

interface EditorActionsMenuComponentProps {
  onActionChange: (action: ActiveEditorAction) => void;
  currentActiveAction: ActiveEditorAction;
  onTogglePreview: () => void;
  isPvExpanded: boolean;
  userRole?: string | null;
  onClear: () => void;
  onCpySummary: () => void;
  canRevise: boolean;
  canTranslate: boolean;
  canCombine: boolean;
  canProceedToFinalReview: boolean;
  canCopySummary: boolean;
  articleBeforeRevision: string;
  handleUndoRevision: () => void;
  isLoading: boolean;
  sessionTotalTokens: number;
  currentRequestTokens: number | null;
  detailedTokenUsage: { text?: number; image?: number } | null;
  tokensLeftInSession: number;
  t: ArticleForgePageTranslations;
  tTokenUsage: TokenUsageTranslations;
}

export const EditorActionsMenuComponent: React.FC<
  EditorActionsMenuComponentProps
> = ({
  onActionChange,
  currentActiveAction,
  onTogglePreview,
  isPvExpanded,
  userRole,
  onClear,
  onCpySummary,
  canRevise,
  canTranslate,
  canCombine,
  canProceedToFinalReview,
  canCopySummary,
  articleBeforeRevision,
  handleUndoRevision,
  isLoading,
  sessionTotalTokens,
  currentRequestTokens,
  detailedTokenUsage,
  tokensLeftInSession,
  t,
  tTokenUsage,
}) => (
  <Card className="mb-4 shadow">
    <CardContent className="flex flex-wrap gap-2 items-center p-2">
      {userRole === "admin" && (
        <Button
          onClick={() => {
            onActionChange(currentActiveAction === "create" ? null : "create");
          }}
          variant={currentActiveAction === "create" ? "default" : "outline"}
          size="sm"
          disabled={isLoading}
        >
          <Bot className="mr-2 h-4 w-4" />
          {t("actions.create", { defaultValue: "Create" })}
        </Button>
      )}
      <Button
        onClick={() =>
          onActionChange(currentActiveAction === "revise" ? null : "revise")
        }
        variant={currentActiveAction === "revise" ? "default" : "outline"}
        size="sm"
        disabled={isLoading || !canRevise}
      >
        <Edit3 className="mr-2 h-4 w-4" />
        {t("actions.revise", { defaultValue: "Revise" })}
      </Button>
      <Button
        onClick={() =>
          onActionChange(
            currentActiveAction === "translate" ? null : "translate"
          )
        }
        variant={currentActiveAction === "translate" ? "default" : "outline"}
        size="sm"
        disabled={isLoading || !canTranslate}
      >
        <Languages className="mr-2 h-4 w-4" />
        {t("actions.translate", { defaultValue: "Translate" })}
      </Button>
      <Button
        onClick={() =>
          onActionChange(currentActiveAction === "combine" ? null : "combine")
        }
        variant={currentActiveAction === "combine" ? "default" : "outline"}
        size="sm"
        disabled={isLoading || !canCombine}
      >
        <Combine className="mr-2 h-4 w-4" />
        {t("actions.combine", { defaultValue: "Combine" })}
      </Button>
      <Button
        onClick={() =>
          onActionChange(
            currentActiveAction === "finalReview" ? null : "finalReview"
          )
        }
        variant={currentActiveAction === "finalReview" ? "default" : "outline"}
        size="sm"
        disabled={isLoading || !canProceedToFinalReview}
      >
        <SendToBack className="mr-2 h-4 w-4" />
        {t("actions.finalReview", { defaultValue: "Final Review" })}
      </Button>
      {articleBeforeRevision && (
        <Button
          onClick={handleUndoRevision}
          variant="outline"
          size="sm"
          className="text-orange-600 border-orange-500 hover:bg-orange-100 hover:text-orange-700"
          disabled={isLoading}
        >
          <Undo2 className="mr-2 h-4 w-4" />
          {t("actions.undoRevision", { defaultValue: "Undo Revision" })}
        </Button>
      )}
      <Button
        onClick={onTogglePreview}
        variant="outline"
        size="sm"
        className="ml-auto"
        disabled={isLoading}
      >
        {isPvExpanded ? (
          <EyeOff className="mr-2 h-4 w-4" />
        ) : (
          <Eye className="mr-2 h-4 w-4" />
        )}
        {isPvExpanded
          ? t("actions.hidePreview", { defaultValue: "Hide Preview" })
          : t("actions.showPreview", { defaultValue: "Show Preview" })}
      </Button>
      {sessionTotalTokens > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              title={tTokenUsage("title")}
            >
              <Coins className="mr-2 h-4 w-4" /> Tokens
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <EditorTokenUsage
              currentRequestTokens={currentRequestTokens}
              detailedTokenUsage={detailedTokenUsage}
              sessionTotalTokens={sessionTotalTokens}
              estimatedInitialSessionTokens={ESTIMATED_INITIAL_SESSION_TOKENS}
              tokensLeftInSession={tokensLeftInSession}
              tTokenUsage={tTokenUsage}
            />
          </PopoverContent>
        </Popover>
      )}
      <Button
        onClick={onCpySummary}
        variant="outline"
        size="sm"
        disabled={isLoading || !canCopySummary}
      >
        <Copy className="mr-2 h-4 w-4" />
        {t("actions.copySummary", { defaultValue: "Copy Summary" })}
      </Button>
      <Button
        onClick={onClear}
        variant="destructive"
        size="sm"
        disabled={isLoading}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {t("actions.clearAll", { defaultValue: "Clear All" })}
      </Button>
    </CardContent>
  </Card>
);
