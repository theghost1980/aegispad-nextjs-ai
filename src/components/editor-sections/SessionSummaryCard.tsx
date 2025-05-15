"use client";

import ArticleEditor from "@/components/article-editor";
import LoadingSpinner from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, FileTerminal } from "lucide-react";
import type { FC } from "react";

type InitialWorkflowType = "aiCreate" | "userWrite";

interface SessionSummaryCardProps {
  initialWorkflow: InitialWorkflowType;
  detectedLanguage: string | null;
  sessionTotalTokens: number;
  sessionTextTokensUsed: number;
  sessionImageTokensUsed: number;
  finalCombinedOutput: string;
  onCopySummary: () => void;
  isLoading: boolean;
  currentOperationMessage: string | null;
  t: (
    key: keyof IntlMessages["ArticleForgePage"]["sessionSummaryCard"],
    values?: Record<string, any>
  ) => string;
}

const SessionSummaryCard: FC<SessionSummaryCardProps> = ({
  initialWorkflow,
  detectedLanguage,
  sessionTotalTokens,
  sessionTextTokensUsed,
  sessionImageTokensUsed,
  finalCombinedOutput,
  onCopySummary,
  isLoading,
  currentOperationMessage,
  t,
}) => {
  return (
    <Card className="shadow-lg max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileTerminal className="mr-2 h-6 w-6 text-primary" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-lg mb-1">{t("workflowTitle")}</h4>
          <p className="text-sm">
            {t("workflowLabel")}{" "}
            <span className="font-medium">
              {initialWorkflow === "aiCreate" ? "AI Creation" : "User Writing"}
            </span>
          </p>
          {detectedLanguage && (
            <p className="text-sm">
              {t("detectedLanguageLabel")}{" "}
              <span className="font-medium">{detectedLanguage}</span>
            </p>
          )}
        </div>
        <div>
          <h4 className="font-semibold text-lg mb-1">{t("tokenUsageTitle")}</h4>
          <p className="text-sm">
            {t("totalTokensUsedLabel")}{" "}
            <span className="font-medium">
              {sessionTotalTokens.toLocaleString()}
            </span>
          </p>
          <p className="text-sm ml-4">
            {t("textGenerationTokensLabel")}{" "}
            <span className="font-medium">
              {sessionTextTokensUsed.toLocaleString()}
            </span>
          </p>
          {sessionImageTokensUsed > 0 && (
            <p className="text-sm ml-4">
              {t("imageGenerationTokensLabel")}{" "}
              <span className="font-medium">
                {sessionImageTokensUsed.toLocaleString()}
              </span>
            </p>
          )}
        </div>
        {finalCombinedOutput ? (
          <div>
            <h4 className="font-semibold text-lg mb-1">
              {t("finalCombinedArticleLabel")}
            </h4>
            <ArticleEditor markdown={finalCombinedOutput} readOnly={true} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("noFinalCombinedArticleMessage")}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={onCopySummary}
          disabled={isLoading}
          className="w-full md:w-auto"
        >
          {isLoading &&
          currentOperationMessage === t("preparingSummaryMessage") ? (
            <LoadingSpinner className="mr-2" size={16} />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {t("copySummaryButton")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SessionSummaryCard;
