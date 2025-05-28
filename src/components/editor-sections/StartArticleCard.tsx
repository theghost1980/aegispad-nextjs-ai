"use client";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArticleForgePageTranslations } from "@/types/translation-types";
import { Eraser, Wand2 } from "lucide-react";
import type { FC } from "react";

interface StartArticleCardProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onMainAction: (prompt: string) => void;
  onClearAll: () => void;
  isLoading: boolean;
  currentOperationMessage: string | null;
  t: ArticleForgePageTranslations;
}

const StartArticleCard: FC<StartArticleCardProps> = ({
  prompt,
  onPromptChange,
  onMainAction,
  onClearAll,
  isLoading,
  currentOperationMessage,
  t,
}) => {
  const mainActionButtonText = t("startArticleCard.aiCreateButtonText");
  const mainActionButtonIcon = <Wand2 className="mr-2 h-4 w-4" />;
  const isMainButtonDisabled = isLoading || !prompt.trim();
  const currentLoadingMessageForButton = t(
    "startArticleCard.creatingArticleMessage"
  );

  return (
    <Card className="shadow-lg max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wand2 className="mr-2 h-6 w-6 text-primary" />
          {t("startArticleCard.title")}
        </CardTitle>
        <CardDescription>{t("startArticleCard.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="prompt" className="text-lg font-medium">
            {t("startArticleCard.promptLabel")}
          </Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={t("startArticleCard.promptPlaceholder")}
            className="min-h-[120px] mt-1 text-base"
            disabled={isLoading}
            aria-label={t("startArticleCard.promptLabel")}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button onClick={onClearAll} variant="outline" disabled={isLoading}>
          <Eraser className="mr-2 h-4 w-4" />{" "}
          {t("startArticleCard.clearAllButton")}
        </Button>
        <Button
          onClick={() => onMainAction(prompt)}
          disabled={isMainButtonDisabled}
        >
          {isLoading &&
          currentOperationMessage === currentLoadingMessageForButton ? (
            <LoadingSpinner className="mr-2" size={16} />
          ) : (
            mainActionButtonIcon
          )}
          {mainActionButtonText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StartArticleCard;
