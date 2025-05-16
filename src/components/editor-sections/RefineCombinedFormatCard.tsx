"use client";

import ArticleEditor from "@/components/article-editor";
import LoadingSpinner from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckSquare, Layers } from "lucide-react";
import type { FC } from "react";

export type CombineFormatType =
  | "simple"
  | "detailsTag"
  | "inline"
  | "inComments";

interface RefineCombinedFormatCardProps {
  selectedCombineFormat: CombineFormatType;
  onSelectedCombineFormatChange: (format: CombineFormatType) => void;
  onCombineFormat: () => void;
  finalCombinedOutput: string;
  onFinalCombinedOutputChange: (markdown: string) => void; // Si el editor es editable
  isLoading: boolean;
  currentOperationMessage: string | null;
  originalArticleForTranslation: string; // Para deshabilitar botón
  translatedArticleMarkdown: string; // Para deshabilitar botón
  t: (
    key: keyof IntlMessages["ArticleForgePage"]["refineFormatCard"],
    values?: Record<string, any>
  ) => string;
}

const RefineCombinedFormatCard: FC<RefineCombinedFormatCardProps> = ({
  selectedCombineFormat,
  onSelectedCombineFormatChange,
  onCombineFormat,
  finalCombinedOutput,
  onFinalCombinedOutputChange,
  isLoading,
  currentOperationMessage,
  originalArticleForTranslation,
  translatedArticleMarkdown,
  t,
}) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Layers className="mr-2 h-6 w-6 text-primary" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-lg font-medium">
            {t("combinationFormatLabel")}
          </Label>
          <RadioGroup
            value={selectedCombineFormat}
            onValueChange={onSelectedCombineFormatChange}
            className="mt-2 space-y-2"
            disabled={isLoading}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="simple" id="format-simple" />
              <Label htmlFor="format-simple" className="font-normal">
                {t("formatSimpleLabel")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="detailsTag" id="format-details" />
              <Label htmlFor="format-details" className="font-normal">
                {t("formatDetailsLabel")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="inline" id="format-inline" />
              <Label htmlFor="format-inline" className="font-normal">
                {t("formatInlineLabel")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="inComments" id="format-in-comments" />
              <Label htmlFor="format-in-comments" className="font-normal">
                {t("formatInCommentsLabel")}
              </Label>
            </div>
          </RadioGroup>
        </div>
        <Button
          onClick={onCombineFormat}
          disabled={
            isLoading ||
            !originalArticleForTranslation.trim() ||
            !translatedArticleMarkdown.trim()
          }
          className="w-full md:w-auto"
        >
          {isLoading &&
          currentOperationMessage === t("generatingCombinedMessage") ? (
            <LoadingSpinner className="mr-2" size={16} />
          ) : (
            <CheckSquare className="mr-2 h-4 w-4" />
          )}
          {t("generateCombinedButton")}
        </Button>

        {finalCombinedOutput && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">
              {t("combinedOutputTitle")}
            </h3>
            <ArticleEditor
              markdown={finalCombinedOutput}
              onMarkdownChange={onFinalCombinedOutputChange}
              isLoading={
                isLoading &&
                currentOperationMessage === t("generatingCombinedMessage")
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RefineCombinedFormatCard;
