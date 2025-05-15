"use client";

import MarkdownPreview from "@/components/markdown-preview";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Globe, Languages } from "lucide-react";
import type { FC } from "react";

interface TranslationResultViewProps {
  originalArticleForTranslation: string;
  translatedArticleMarkdown: string;
  targetLanguage: string;
  detectedLanguage: string | null;
  t: (
    key: keyof IntlMessages["ArticleForgePage"]["translationResultCard"],
    values?: Record<string, any>
  ) => string;
}

const TranslationResultView: FC<TranslationResultViewProps> = ({
  originalArticleForTranslation,
  translatedArticleMarkdown,
  targetLanguage,
  detectedLanguage,
  t,
}) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Globe className="mr-2 h-6 w-6 text-primary" />
          {t("title")}
        </CardTitle>
        <CardDescription>
          {t("description", { targetLanguage })}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <FileText size={20} className="mr-2 text-muted-foreground" />
              {detectedLanguage
                ? `${t("originalArticleTitle")} (${detectedLanguage})`
                : t("originalArticleTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <Textarea
              value={originalArticleForTranslation}
              readOnly
              className="min-h-[300px] text-sm resize-y bg-muted/20 h-full"
              aria-label={t("originalArticleAriaLabel")}
            />
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Languages size={20} className="mr-2 text-muted-foreground" />{" "}
              {t("translatedArticleTitle", { targetLanguage })}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <MarkdownPreview
              markdown={translatedArticleMarkdown}
              minHeight="300px"
              className="h-full"
              ariaLabel={t("translatedPreviewAriaLabel", { targetLanguage })}
            />
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default TranslationResultView;
