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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages } from "lucide-react";
import type { FC } from "react";

interface LanguageOption {
  value: string;
  label: string;
}

interface TranslateArticleCardProps {
  targetLanguage: string;
  onTargetLanguageChange: (language: string) => void;
  availableLanguages: LanguageOption[];
  detectedLanguage: string | null;
  onTranslateArticle: () => void;
  isLoading: boolean;
  currentOperationMessage: string | null;
  translationProgress: {
    current: number;
    total: number;
  } | null;
  articleMarkdown: string; // Necesario para deshabilitar el botón si no hay markdown
  t: (
    key: keyof IntlMessages["ArticleForgePage"]["translateArticleCard"],
    values?: Record<string, any>
  ) => string;
}

const TranslateArticleCard: FC<TranslateArticleCardProps> = ({
  targetLanguage,
  onTargetLanguageChange,
  availableLanguages,
  detectedLanguage,
  onTranslateArticle,
  isLoading,
  currentOperationMessage,
  translationProgress,
  articleMarkdown,
  t,
}) => {
  return (
    <Card className="shadow-lg max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Languages className="mr-2 h-6 w-6 text-primary" />
          {t("title")}
        </CardTitle>
        <CardDescription>
          {detectedLanguage
            ? t("descriptionWithSource", { detectedLanguage })
            : t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="targetLanguage" className="text-lg font-medium">
            {t("targetLanguageLabel")}
          </Label>
          <Select
            value={targetLanguage}
            onValueChange={onTargetLanguageChange}
            disabled={isLoading}
          >
            <SelectTrigger
              id="targetLanguage"
              className="mt-1 text-base"
              aria-label={t("targetLanguageLabel")}
            >
              <SelectValue placeholder={t("selectLanguagePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {translationProgress && isLoading && (
          <div className="text-sm text-muted-foreground mt-2">
            <p>
              {t("translatingChunkMessage", {
                current: translationProgress.current,
                total: translationProgress.total,
              })}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={onTranslateArticle}
          disabled={
            isLoading || !articleMarkdown.trim() || !targetLanguage.trim()
          }
          className="w-full md:w-auto"
        >
          {isLoading &&
          (currentOperationMessage?.startsWith(
            t("translatingChunkMessage", { current: 1, total: 1 }).substring(
              0,
              10
            )
          ) || // Check if message starts with "Translating chunk"
            currentOperationMessage === t("translatingArticleMessage")) ? (
            <LoadingSpinner className="mr-2" size={16} />
          ) : (
            <Languages className="mr-2 h-4 w-4" />
          )}
          {t("translateButton")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TranslateArticleCard;
