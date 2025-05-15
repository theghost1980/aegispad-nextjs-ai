// src/components/article-editor.tsx
"use client";

import MarkdownPreview from "@/components/markdown-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import type { FC } from "react";

interface ArticleEditorProps {
  markdown: string;
  onMarkdownChange?: (markdown: string) => void; // Hacer onMarkdownChange opcional
  isLoading?: boolean;
  readOnly?: boolean; // Añadir la prop readOnly
}

const ArticleEditor: FC<ArticleEditorProps> = ({
  markdown,
  onMarkdownChange = () => {}, // Proveer un default no-op si no se pasa
  isLoading = false,
  readOnly = false,
}) => {
  const t = useTranslations("ArticleEditor");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>{t("markdownEditorTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <Textarea
            value={markdown}
            onChange={(e) => onMarkdownChange(e.target.value)}
            placeholder={t("markdownPlaceholder")}
            className="min-h-[400px] text-sm resize-y h-full"
            disabled={isLoading || readOnly} // Usar readOnly para deshabilitar
            aria-label={t("ariaLabelEditor")}
          />
        </CardContent>
      </Card>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>{t("previewTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <MarkdownPreview
            markdown={markdown}
            ariaLabel={t("ariaLabelPreview")}
            className="h-full"
            minHeight="400px"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticleEditor;
