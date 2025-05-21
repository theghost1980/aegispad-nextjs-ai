"use client";

import ArticleEditor from "@/components/article-editor";
import TagInput from "@/components/custom/TagInput"; // Importar TagInput
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
import { Input } from "@/components/ui/input"; // Importar Input para el título
import {
  AEGISPAD_DEFAULT_TAG,
  APP_NAME,
  APP_VERSION,
  FINAL_REVIEW_ARTICLE_STORAGE_KEY,
} from "@/constants/constants";
import { useHiveAuth } from "@/hooks/use-hive-auth";
import { toast } from "@/hooks/use-toast";
import { KeychainHelper } from "keychain-helper";
import { Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import posthog from "posthog-js"; // Importar PostHog
import { useEffect, useState } from "react";

interface StoredArticleData {
  title: string;
  content: string;
}

export default function FinalReviewPage() {
  const t = useTranslations("FinalReviewPage");
  const router = useRouter();
  const {
    isAuthenticated: isHiveLoggedIn,
    isLoading: isLoadingHiveAuth,
    hiveUsername, // Necesitamos el nombre de usuario para publicar
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
        } catch (error) {
          console.error("Error parsing stored article data:", error);
          // Si hay un error al parsear, podría ser una cadena antigua sin estructura JSON
          // En este caso, podríamos tratarla como solo contenido o limpiarla.
          // Por ahora, la trataremos como contenido si es una cadena.
          if (typeof storedDataString === "string") {
            setArticleContent(storedDataString);
            setInitialContentFromStorage(storedDataString);
          }
          setArticleTitle(""); // Resetear título si el parseo falla
          setInitialTitleFromStorage("");
        }
      }
      setIsArticleLoading(false);
    }
  }, [clientLoaded, isHiveLoggedIn]);

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
        content: articleContent || "", // Guardar cadena vacía si el contenido es null
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
      // Hive permite 0 etiquetas, pero generalmente se recomienda al menos 1.
      // El ejemplo pedía al menos 2, pero la primera es la categoría principal.
      // Ajustamos a al menos 1 para la categoría principal.
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
      .replace(/[^\w\s-]/g, "") // Eliminar caracteres no alfanuméricos excepto espacios y guiones
      .replace(/\s+/g, "-") // Reemplazar espacios con guiones
      .replace(/-+/g, "-") // Reemplazar múltiples guiones con uno solo
      .slice(0, 255); // Limitar longitud del permlink

    const parentPermlink = tags[0]; // Usar la primera etiqueta como categoría principal

    const jsonMetadata = {
      tags: tags,
      app: `${APP_NAME.toLowerCase()}/${APP_VERSION}`,
      format: "markdown",
      // Opcional: puedes añadir una imagen principal aquí si la tienes
      // image: ["URL_DE_LA_IMAGEN_PRINCIPAL"]
    };

    // Para un post principal, no se necesitan comment_options complejas,
    // pero Hive Keychain espera un objeto JSON vacío o con opciones específicas si se usan.
    // Dejaremos las extensiones vacías por ahora.
    const commentOptions = JSON.stringify({
      author: hiveUsername,
      permlink: permlink,
      max_accepted_payout: "1000000.000 HBD", // Valor estándar
      percent_hbd: 10000, // 100% HBD (50/50 HBD/HP) - esto es 10000 para 100%
      allow_votes: true,
      allow_curation_rewards: true,
      extensions: [],
    });

    try {
      // Evento de intento de publicación en PostHog
      posthog.capture("publish_attempt", {
        username: hiveUsername,
        title_length: articleTitle.length,
        content_length: articleContent.length,
        tags_count: tags.length,
        permlink: permlink,
        parent_permlink: parentPermlink,
      });

      KeychainHelper.requestPost(
        hiveUsername, // author
        articleTitle, // title
        articleContent, // body
        parentPermlink, // parent_permlink (categoría principal)
        "", // parent_author (vacío para post principal)
        JSON.stringify(jsonMetadata), // json_metadata
        permlink, // permlink
        commentOptions, // comment_options
        (response) => {
          if (response.success) {
            // Evento de publicación exitosa en PostHog
            posthog.capture("publish_success", {
              username: hiveUsername,
              permlink: permlink,
              parent_permlink: parentPermlink,
              transaction_id: response.result?.id, // Asumiendo que Keychain devuelve el ID de la tx
            });

            toast({
              title: t("publishSuccessTitle"),
              description: t("publishSuccessDescription"),
            });
            // Opcional: limpiar el artículo guardado y redirigir
            localStorage.removeItem(FINAL_REVIEW_ARTICLE_STORAGE_KEY);
            router.push(`/profile`); // Redirigir al perfil general o a una página de posts
          } else {
            // Evento de publicación fallida en PostHog
            posthog.capture("publish_failed", {
              username: hiveUsername,
              permlink: permlink,
              error_message: response.message || "Keychain operation failed",
              error_details: response.error, // Si Keychain proporciona más detalles del error
            });
            throw new Error(response.message || "Keychain operation failed"); // Esto será capturado por el catch
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
      // Asegurarse de capturar el fallo también si el error no vino del callback de Keychain
      // (aunque en este flujo, la mayoría de los errores de Keychain se manejarían en el callback)
      posthog.capture("publish_failed", {
        username: hiveUsername,
        permlink: permlink, // permlink podría no estar definido si el error es muy temprano
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

      {articleContent !== null && (
        <div className="my-4">
          <h2 className="text-xl font-semibold mb-2">{t("tagsTitle")}</h2>
          <TagInput onTagsChange={setTags} initialTags={tags} />
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
