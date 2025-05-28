"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArticleForgePageTranslations } from "@/types/translation-types";
import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface MarkdownPreviewComponentProps {
  content: string;
  t: ArticleForgePageTranslations;
}

export const MarkdownPreviewComponent: React.FC<
  MarkdownPreviewComponentProps
> = ({ content, t }) => {
  return (
    <Card className="shadow h-full">
      <CardHeader>
        <CardTitle>
          {t("markdownPreview.title", { defaultValue: "Markdown Preview" })}
        </CardTitle>
      </CardHeader>
      <CardContent className="prose dark:prose-invert max-w-none p-6 pt-0">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {content}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
};
