"use client";

import ArticleEditor from "@/components/article-editor";
import TagInput from "@/components/custom/TagInput";
import SubscribedCommunitiesList from "@/components/editor-sections/SubscribedCommunitiesList";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AEGISPAD_ACCOUNT_BENEFITS_PERCENTAGE,
  AEGISPAD_ACCOUNT_NAME,
  AEGISPAD_DEFAULT_TAG,
  APP_NAME,
  APP_VERSION,
  FINAL_REVIEW_ARTICLE_STORAGE_KEY,
  MAX_HIVE_TAGS,
} from "@/constants/constants";
import { useHiveAuth } from "@/hooks/use-hive-auth";
import { toast } from "@/hooks/use-toast";
import { StoredArticleData, SubscribedCommunity } from "@/types/general.types";
import { KeychainHelper } from "keychain-helper";
import { Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useState } from "react";

export default function FinalReviewPage() {
  const t = useTranslations("FinalReviewPage");
  const tCommunitiesList = useTranslations("FinalReviewPage.communitiesList");

  const router = useRouter();
  const {
    isAuthenticated: isHiveLoggedIn,
    authenticatedFetch,
    isLoading: isLoadingHiveAuth,
    hiveUsername,
  } = useHiveAuth();

  const [articleTitle, setArticleTitle] = useState<string>("");
  const [articleContent, setArticleContent] = useState<string | null>(null);
  const [initialTitleFromStorage, setInitialTitleFromStorage] =
    useState<string>("");
  const [initialContentFromStorage, setInitialContentFromStorage] = useState<
    string | null
  >(null);

  const [isArticleLoading, setIsArticleLoading] = useState(true);
  const [clientLoaded, setClientLoaded] = useState(false);
  const [tags, setTags] = useState<string[]>([AEGISPAD_DEFAULT_TAG]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [subscribedCommunities, setSubscribedCommunities] = useState<
    SubscribedCommunity[]
  >([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);
  const [communitiesError, setCommunitiesError] = useState<string | null>(null);
  const [postType, setPostType] = useState<"blog" | "community">("blog");
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(
    null
  );
  const [aiAddedInitialTags, setAiAddedInitialTags] = useState<Set<string>>(
    new Set()
  );

  const pathname = usePathname();

  const handleFetchPopularTags = async (): Promise<string[] | undefined> => {
    // TODO: Implementar llamada real al API endpoint /api/hive/popular-tags
    console.log("Fetching popular tags from Hive...");
    // Simulación de llamada a API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Ejemplo de respuesta (estos deberían venir de tu API)
    const popularTagsFromApi = [
      "hive",
      "posh",
      "gaming",
      "art",
      "photography",
      "music",
      "leo",
      "palnet",
      "neoxian",
      "vyb",
    ];
    // Filtrar para no sugerir el tag por defecto si ya está
    return popularTagsFromApi.filter(
      (tag) => tag.toLowerCase() !== AEGISPAD_DEFAULT_TAG.toLowerCase()
    );
  };

  const handleFetchArticleKeywords = async (
    content: string
  ): Promise<string[] | undefined> => {
    // TODO: Implementar llamada real al API endpoint /api/ai/suggest-article-tags
    console.log(
      "Fetching article keywords based on content...",
      content.substring(0, 100)
    );
    if (!content.trim()) {
      toast({ title: "Error", description: "Article content is empty." });
      return [];
    }
    // Simulación de llamada a API
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // Ejemplo de respuesta (estos deberían venir de tu API)
    const keywordsFromApi = [
      "technology",
      "ai",
      "review",
      "future",
      "innovation",
    ];
    return keywordsFromApi;
  };
  // --- Fin de funciones para sugerencias de Tags ---

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
      const storedDataString = localStorage.getItem(
        FINAL_REVIEW_ARTICLE_STORAGE_KEY
      );
      if (storedDataString) {
        try {
          const storedData: StoredArticleData = JSON.parse(storedDataString);
          setArticleTitle(storedData.title || "");
          setArticleContent(storedData.content || null);
          setInitialTitleFromStorage(storedData.title || "");
          setInitialContentFromStorage(storedData.content || null);

          if (storedData.suggestedTags && storedData.suggestedTags.length > 0) {
            setTags((currentTags) => {
              if (
                currentTags.length === 1 &&
                currentTags[0].toLowerCase() ===
                  AEGISPAD_DEFAULT_TAG.toLowerCase()
              ) {
                const uniqueNewTags = storedData.suggestedTags!.filter(
                  (tag) =>
                    tag.toLowerCase() !== AEGISPAD_DEFAULT_TAG.toLowerCase()
                );
                const aiTagsFromStorage = new Set(
                  uniqueNewTags.map((t) => t.toLowerCase())
                );
                setAiAddedInitialTags(aiTagsFromStorage);
                return [
                  AEGISPAD_DEFAULT_TAG,
                  ...uniqueNewTags.slice(0, MAX_HIVE_TAGS - 1),
                ];
              }
              return currentTags;
            });
          }
        } catch (error) {
          console.error("Error parsing stored article data:", error);
          if (typeof storedDataString === "string") {
            setArticleContent(storedDataString);
            setInitialContentFromStorage(storedDataString);
          }
          setArticleTitle("");
          setInitialTitleFromStorage("");
        }
      }
      setIsArticleLoading(false);
    }
  }, [clientLoaded, isHiveLoggedIn]);

  useEffect(() => {
    if (clientLoaded && isHiveLoggedIn && authenticatedFetch) {
      const fetchSubscribedCommunities = async () => {
        setIsLoadingCommunities(true);
        setCommunitiesError(null);
        try {
          const response = await authenticatedFetch(
            "/api/user/hive/hive-subscriptions"
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.message || "Failed to fetch subscribed communities"
            );
          }
          const data: SubscribedCommunity[] = await response.json();
          setSubscribedCommunities(data);
        } catch (error: any) {
          setCommunitiesError(error.message);
          console.error("Error fetching subscribed communities:", error);
        } finally {
          setIsLoadingCommunities(false);
        }
      };
      fetchSubscribedCommunities();
    }
  }, [clientLoaded, isHiveLoggedIn, authenticatedFetch]);

  const isDirty =
    articleTitle !== initialTitleFromStorage ||
    articleContent !== initialContentFromStorage;

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
    if (articleTitle !== null || articleContent !== null) {
      const dataToStore: StoredArticleData = {
        title: articleTitle,
        content: articleContent || "",
      };
      localStorage.setItem(
        FINAL_REVIEW_ARTICLE_STORAGE_KEY,
        JSON.stringify(dataToStore)
      );
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

  const handlePublishToHive = async () => {
    if (!hiveUsername) {
      toast({
        title: t("publishErrorTitle"),
        description: t("publishErrorNoAuthor"),
        variant: "destructive",
      });
      return;
    }
    if (!articleTitle.trim()) {
      toast({
        title: t("publishErrorTitle"),
        description: t("publishErrorEmptyTitle"),
        variant: "destructive",
      });
      return;
    }
    if (tags.length < 1) {
      toast({
        title: t("publishErrorTitle"),
        description: t("publishErrorMinTags", { minTags: 1 }),
        variant: "destructive",
      });
      return;
    }
    if (!articleContent || !articleContent.trim()) {
      toast({
        title: t("publishErrorTitle"),
        description: t("publishErrorEmptyContent"),
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);

    const permlink = articleTitle
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 255);

    const parentPermlink =
      postType === "community" && selectedCommunity
        ? selectedCommunity
        : tags[0];

    const jsonMetadata = {
      tags: tags,
      app: `${APP_NAME.toLowerCase()}/${APP_VERSION}`,
      format: "markdown",
      // Opcional: puedes añadir una imagen principal aquí si la tienes
      // image: ["URL_DE_LA_IMAGEN_PRINCIPAL"]
    };

    const commentOptions = JSON.stringify({
      author: hiveUsername,
      permlink: permlink,
      max_accepted_payout: "1000000.000 HBD",
      percent_hbd: 10000,
      allow_votes: true,
      allow_curation_rewards: true,
      extensions: [
        [
          0,
          {
            beneficiaries: [
              {
                account: AEGISPAD_ACCOUNT_NAME,
                weight: AEGISPAD_ACCOUNT_BENEFITS_PERCENTAGE,
              },
            ],
          },
        ],
      ],
    });

    try {
      posthog.capture("publish_attempt", {
        username: hiveUsername,
        title_length: articleTitle.length,
        content_length: articleContent.length,
        tags_count: tags.length,
        permlink: permlink,
        parent_permlink: parentPermlink,
      });

      KeychainHelper.requestPost(
        hiveUsername,
        articleTitle,
        articleContent,
        parentPermlink,
        "",
        JSON.stringify(jsonMetadata),
        permlink,
        commentOptions,
        (response) => {
          if (response.success) {
            posthog.capture("publish_success", {
              username: hiveUsername,
              permlink: permlink,
              parent_permlink: parentPermlink,
              transaction_id: response.result?.id,
            });

            toast({
              title: t("publishSuccessTitle"),
              description: t("publishSuccessDescription"),
            });
            localStorage.removeItem(FINAL_REVIEW_ARTICLE_STORAGE_KEY);
            router.push(`/profile`);
          } else {
            posthog.capture("publish_failed", {
              username: hiveUsername,
              permlink: permlink,
              error_message: response.message || "Keychain operation failed",
              error_details: response.error,
            });
            throw new Error(response.message || "Keychain operation failed");
          }
        }
      );
    } catch (error: any) {
      console.error("Error publishing to Hive:", error);
      toast({
        title: t("publishErrorTitle"),
        description: error.message || t("publishErrorUnknown"),
        variant: "destructive",
      });
      posthog.capture("publish_failed", {
        username: hiveUsername,
        permlink: permlink,
        description: error.message || t("publishErrorUnknown"),
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
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

  if (clientLoaded && isHiveLoggedIn && !isLoadingCommunities) {
    console.log("Subscribed Communities:", subscribedCommunities);
    console.log("Communities Error:", communitiesError);
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

      {articleContent !== null && (
        <div className="mb-4">
          <label
            htmlFor="articleTitle"
            className="block text-xl font-semibold mb-2"
          >
            {t("titleLabel")}
          </label>
          <Input
            id="articleTitle"
            type="text"
            placeholder={t("titlePlaceholder")}
            value={articleTitle}
            onChange={(e) => setArticleTitle(e.target.value)}
            className="text-2xl p-4 bg-white rounded-md border"
            disabled={isArticleLoading}
          />
        </div>
      )}

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
            onMarkdownChange={setArticleContent}
            isLoading={isArticleLoading}
            collapsable
            allowEditorHide
          />
        </div>
      )}

      {articleContent !== null && subscribedCommunities.length > 0 && (
        <div className="my-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                {t("communitiesList.listTitle", {
                  defaultValue: "Your Subscribed Communities",
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="post-type-switch"
                    checked={postType === "community"}
                    onCheckedChange={(checked) => {
                      setPostType(checked ? "community" : "blog");
                      if (!checked) {
                        setSelectedCommunity(null);
                      } else if (
                        subscribedCommunities.length > 0 &&
                        !selectedCommunity
                      ) {
                        // Opcional: seleccionar la primera comunidad por defecto al cambiar a "community"
                        // setSelectedCommunity(subscribedCommunities[0].name);
                      }
                    }}
                  />
                  <Label htmlFor="post-type-switch">
                    {t("postToCommunityLabel")}
                  </Label>
                </div>

                {postType === "community" && (
                  <SubscribedCommunitiesList
                    communities={subscribedCommunities}
                    isLoading={isLoadingCommunities}
                    error={communitiesError}
                    t={tCommunitiesList}
                    displayMode={"min"}
                    onCommunitySelect={setSelectedCommunity}
                    selectedValue={selectedCommunity}
                  />
                )}
              </CardContent>
            </CardContent>
          </Card>
        </div>
      )}

      {articleContent !== null && (
        <div className="my-4">
          <h2 className="text-xl font-semibold mb-2">{t("tagsTitle")}</h2>
          <TagInput
            onTagsChange={setTags}
            initialTags={tags}
            articleContent={articleContent || ""}
            onFetchPopularTags={handleFetchPopularTags}
            onFetchArticleKeywords={handleFetchArticleKeywords}
            initialAiTags={aiAddedInitialTags}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t("tagsDescription")}
          </p>
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
              disabled={
                isArticleLoading || articleContent === null || isPublishing
              }
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="mr-2 h-4 w-4" />
              {t("publishButton")}
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveForLater}
              disabled={
                isArticleLoading || articleContent === null || isPublishing
              }
            >
              {t("saveButton")}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={
                    isArticleLoading || articleContent === null || isPublishing
                  }
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
