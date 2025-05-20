"use client";

import ArticleEditor from "@/components/article-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FINAL_REVIEW_ARTICLE_STORAGE_KEY } from "@/constants/constants";
import { useHiveAuth } from "@/hooks/use-hive-auth";
import { toast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function FinalReviewPage() {
  const t = useTranslations("FinalReviewPage");
  const router = useRouter();
  const { isAuthenticated: isHiveLoggedIn, isLoading: isLoadingHiveAuth } =
    useHiveAuth();

  const [articleContent, setArticleContent] = useState<string | null>(null);
  const [initialContentFromStorage, setInitialContentFromStorage] = useState<
    string | null
  >(null);
  const [isArticleLoading, setIsArticleLoading] = useState(true);
  const [clientLoaded, setClientLoaded] = useState(false);

  useEffect(() => {
    setClientLoaded(true);
  }, []);

  useEffect(() => {
    if (clientLoaded && !isLoadingHiveAuth && !isHiveLoggedIn) {
      router.push("/login");
    }
  }, [clientLoaded, isLoadingHiveAuth, isHiveLoggedIn, router]);

  useEffect(() => {
    if (clientLoaded && isHiveLoggedIn) {
      const storedArticle = localStorage.getItem(
        FINAL_REVIEW_ARTICLE_STORAGE_KEY
      );
      setArticleContent(storedArticle);
      setInitialContentFromStorage(storedArticle);
      setIsArticleLoading(false);
    }
  }, [clientLoaded, isHiveLoggedIn]);

  const isDirty =
    articleContent !== null &&
    initialContentFromStorage !== null &&
    articleContent !== initialContentFromStorage;

  const handleContentChange = (newContent: string) => {
    setArticleContent(newContent);
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        const message = t("leaveConfirmationMessage");
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, t]);

  const handleSaveForLater = () => {
    if (articleContent !== null) {
      localStorage.setItem(FINAL_REVIEW_ARTICLE_STORAGE_KEY, articleContent);
      toast({
        title: t("saveSuccessToastTitle"),
        description: t("saveSuccessToastDescription"),
      });
    }
  };

  const handleDiscard = () => {
    localStorage.removeItem(FINAL_REVIEW_ARTICLE_STORAGE_KEY);
    toast({
      title: t("discardSuccessToastTitle"),
      description: t("discardSuccessToastDescription"),
    });
    router.push("/");
  };

  const handlePublishToHive = () => {
    console.log("Attempting to publish to Hive:", articleContent);
    toast({
      title: "Publish to Hive (Placeholder)",
      description:
        "This feature is coming soon! Article content logged to console.",
    });
  };

  if (
    !clientLoaded ||
    isLoadingHiveAuth ||
    (isHiveLoggedIn && isArticleLoading)
  ) {
    let message = t("loadingPage");
    if (isHiveLoggedIn && isArticleLoading) {
      message = t("loadingArticle");
    }
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>{message}</p>
      </div>
    );
  }

  if (!isHiveLoggedIn) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>{t("accessDenied")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{t("redirectingToLogin")}</p>
            <Button onClick={() => router.push("/login")}>
              {t("loginButton")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 flex flex-col h-full space-y-4">
      <header className="mb-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("pageDescription")}</p>
      </header>

      {articleContent === null && !isArticleLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <p>{t("noArticleContent")}</p>
          </CardContent>
        </Card>
      )}
      {articleContent !== null && (
        <div className="flex-1 overflow-hidden">
          <ArticleEditor
            markdown={articleContent || ""}
            onMarkdownChange={handleContentChange}
            isLoading={isArticleLoading}
            collapsable
            allowEditorHide
          />
        </div>
      )}

      {articleContent !== null && (
        <footer className="py-4 mt-auto border-t">
          <div className="container mx-auto flex flex-col md:flex-row justify-end items-center space-y-2 md:space-y-0 md:space-x-2">
            <h3 className="text-lg font-semibold mr-auto hidden md:block">
              {t("actionsTitle")}
            </h3>
            <Button
              onClick={handlePublishToHive}
              disabled={isArticleLoading || articleContent === null}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="mr-2 h-4 w-4" />
              {t("publishButton")}
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveForLater}
              disabled={isArticleLoading || articleContent === null}
            >
              {t("saveButton")}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={isArticleLoading || articleContent === null}
                >
                  {t("discardButton")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("discardDialogTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("discardDialogDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t("discardDialogCancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleDiscard}>
                    {t("discardDialogConfirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </footer>
      )}
    </div>
  );
}
