"use client";

import type { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ArticleEditorProps {
  markdown: string;
  onMarkdownChange: (markdown: string) => void;
  isLoading?: boolean;
}

const ArticleEditor: FC<ArticleEditorProps> = ({ markdown, onMarkdownChange, isLoading = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Markdown Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={markdown}
            onChange={(e) => onMarkdownChange(e.target.value)}
            placeholder="Your article in Markdown format will appear here..."
            className="min-h-[400px] text-sm resize-y"
            disabled={isLoading}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="min-h-[400px] h-[400px] p-4 border rounded-md bg-muted/30">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-sm dark:prose-invert max-w-none"
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-2" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-semibold my-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-semibold my-1" {...props} />,
                p: ({node, ...props}) => <p className="my-1" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 my-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-1" {...props} />,
                li: ({node, ...props}) => <li className="my-0.5" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="pl-4 border-l-4 border-muted-foreground italic my-2" {...props} />,
                code: ({node, inline, className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                     <pre className="bg-muted p-2 rounded-md overflow-x-auto my-2"><code className={className} {...props}>{children}</code></pre>
                  ) : (
                    <code className="bg-muted px-1 py-0.5 rounded-sm" {...props}>{children}</code>
                  )
                }
              }}
            >
              {markdown}
            </ReactMarkdown>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticleEditor;
