// src/components/article-editor.tsx
"use client";

import type { FC } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MarkdownPreview from '@/components/markdown-preview';

interface ArticleEditorProps {
  markdown: string;
  onMarkdownChange: (markdown: string) => void;
  isLoading?: boolean;
}

const ArticleEditor: FC<ArticleEditorProps> = ({ markdown, onMarkdownChange, isLoading = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Markdown Editor</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <Textarea
            value={markdown}
            onChange={(e) => onMarkdownChange(e.target.value)}
            placeholder="Your article in Markdown format will appear here..."
            className="min-h-[400px] text-sm resize-y h-full"
            disabled={isLoading}
            aria-label="Markdown editor for article content"
          />
        </CardContent>
      </Card>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <MarkdownPreview markdown={markdown} ariaLabel="Article preview" className="h-full" minHeight="400px" />
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticleEditor;
