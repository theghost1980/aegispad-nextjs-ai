// src/components/markdown-preview.tsx
"use client";

import type { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface MarkdownPreviewProps {
  markdown: string;
  className?: string;
  minHeight?: string;
  ariaLabel?: string;
}

const MarkdownPreview: FC<MarkdownPreviewProps> = ({ markdown, className, minHeight = '400px', ariaLabel = "Markdown content preview" }) => {
  return (
    <ScrollArea className={cn("p-4 border rounded-md bg-muted/30", className)} style={{ minHeight }} aria-label={ariaLabel}>
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
          code: ({node, inline, className: codeClassName, children, ...props}) => {
            const match = /language-(\w+)/.exec(codeClassName || '');
            return !inline && match ? (
              <pre className="bg-muted p-2 rounded-md overflow-x-auto my-2"><code className={codeClassName} {...props}>{children}</code></pre>
            ) : (
              <code className="bg-muted px-1 py-0.5 rounded-sm" {...props}>{children}</code>
            );
          }
        }}
      >
        {markdown || "No content to display."}
      </ReactMarkdown>
    </ScrollArea>
  );
};

export default MarkdownPreview;
