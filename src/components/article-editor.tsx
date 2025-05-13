// src/components/article-editor.tsx
"use client";

import type { FC } from 'react';
import { useTranslations } from 'next-intl';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MarkdownPreview from '@/components/markdown-preview';

interface ArticleEditorProps {
  markdown: string;
  onMarkdownChange: (markdown: string) => void;
  isLoading?: boolean;
}

const ArticleEditor: FC<ArticleEditorProps> = ({ markdown, onMarkdownChange, isLoading = false }) => {
  const t = useTranslations('ArticleEditor');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>{t('markdownEditorTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <Textarea
            value={markdown}
            onChange={(e) => onMarkdownChange(e.target.value)}
            placeholder={t('markdownPlaceholder')}
            className="min-h-[400px] text-sm resize-y h-full"
            disabled={isLoading}
            aria-label={t('ariaLabelEditor')}
          />
        </CardContent>
      </Card>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>{t('previewTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <MarkdownPreview 
            markdown={markdown} 
            ariaLabel={t('ariaLabelPreview')} 
            className="h-full" 
            minHeight="400px" 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticleEditor;
