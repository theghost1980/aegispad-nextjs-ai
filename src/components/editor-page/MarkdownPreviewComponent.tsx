"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface MarkdownPreviewComponentProps {
  content: string;
  title: string;
}

export const MarkdownPreviewComponent: React.FC<
  MarkdownPreviewComponentProps
> = ({ content, title }) => {
  return (
    <Card className="shadow h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="prose dark:prose-invert max-w-none p-6 pt-0">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {content}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
};
