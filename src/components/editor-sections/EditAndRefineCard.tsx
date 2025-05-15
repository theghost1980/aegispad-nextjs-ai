"use client";

import ArticleEditor from "@/components/article-editor";
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
import { Edit3 } from "lucide-react";
import type { FC } from "react";

interface EditAndRefineCardProps {
  articleMarkdown: string;
  onArticleMarkdownChange: (markdown: string) => void;
  onReviseArticle: () => void;
  isLoading: boolean;
  currentOperationMessage: string | null;
  t: (
    key: keyof IntlMessages["ArticleForgePage"]["editArticleCard"],
    values?: Record<string, any>
  ) => string;
}

const EditAndRefineCard: FC<EditAndRefineCardProps> = ({
  articleMarkdown,
  onArticleMarkdownChange,
  onReviseArticle,
  isLoading,
  currentOperationMessage,
  t,
}) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Edit3 className="mr-2 h-6 w-6 text-primary" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ArticleEditor
          markdown={articleMarkdown}
          onMarkdownChange={onArticleMarkdownChange}
          isLoading={isLoading}
        />
      </CardContent>
      <CardFooter>
        <Button
          onClick={onReviseArticle}
          disabled={isLoading || !articleMarkdown.trim()}
          className="w-full md:w-auto"
        >
          {isLoading &&
          currentOperationMessage === t("revisingArticleMessage") ? (
            <LoadingSpinner className="mr-2" size={16} />
          ) : (
            <Edit3 className="mr-2 h-4 w-4" />
          )}
          {t("reviseButton")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EditAndRefineCard;
