"use client";

import LoadingSpinner from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTheme } from "@/context/theme-context";
import { useHiveAuth } from "@/hooks/use-hive-auth";
import { useToast } from "@/hooks/use-toast";
import {
  getItem as getIndexedDbItem,
  setItem as setIndexedDbItem,
} from "@/lib/indexed-db-service";
import { UserPreferences } from "@/types/general.types";
import { Shield } from "lucide-react";
import { useTranslations } from "next-intl"; // Correct import
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type TokenUsageRecord = {
  timestamp: string;
  operation_type: string;
  model_used: string | null;
  text_tokens_used: number | null;
  image_tokens_used: number | null;
  details_json: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  } | null;
};

export default function ProfilePage() {
  const t = useTranslations("ProfilePage");
  const { toast } = useToast();
  const { setTheme, theme: currentNextTheme } = useTheme();
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [selectedTheme, setSelectedTheme] =
    useState<UserPreferences["theme_preference"]>("system");
  const [selectedLoginRedirect, setSelectedLoginRedirect] =
    useState<UserPreferences["login_redirect_preference"]>("/");

  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    hiveUsername,
    userRole,
    authenticatedFetch,
    preferences,
  } = useHiveAuth();

  const router = useRouter();

  const [tokenUsageHistory, setTokenUsageHistory] = useState<
    TokenUsageRecord[]
  >([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [totalTextTokensUsed, setTotalTextTokensUsed] = useState<number>(0);
  const [totalImageUnitsUsed, setTotalImageUnitsUsed] = useState<number>(0);

  // Ref to track if initial preferences have been applied to local state
  const initialPrefsApplied = useRef(false);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Effect to initialize local UI state from useHiveAuth.preferences and apply initial theme
  useEffect(() => {
    if (preferences && !initialPrefsApplied.current) {
      const initialTheme = preferences.theme_preference || "system";
      const initialRedirect = preferences.login_redirect_preference || "/";

      setSelectedTheme(initialTheme);
      setSelectedLoginRedirect(initialRedirect);

      if (initialTheme && initialTheme !== currentNextTheme) {
        setTheme(initialTheme);
      }
      initialPrefsApplied.current = true; // Mark as initialized
    }
    // This effect should run when `preferences` from useHiveAuth becomes available,
    // and also react to `currentNextTheme` changes if the preference is "system".
  }, [preferences, setTheme, currentNextTheme]);

  // Efecto para cargar el historial de tokens
  useEffect(() => {
    if (isAuthenticated && authenticatedFetch) {
      const fetchHistory = async () => {
        setIsLoadingHistory(true);
        setHistoryError(null);
        try {
          const response = await authenticatedFetch(
            "/api/user/token-usage-history"
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.message || t("errors.fetchHistoryFailed")
            );
          }
          const data: TokenUsageRecord[] = await response.json();
          setTokenUsageHistory(data);

          let textTokensSum = 0;
          let imageUnitsSum = 0;
          data.forEach((record) => {
            textTokensSum +=
              record.text_tokens_used ||
              record.details_json?.totalTokenCount ||
              0;
            imageUnitsSum += record.image_tokens_used || 0;
          });
          setTotalTextTokensUsed(textTokensSum);
          setTotalImageUnitsUsed(imageUnitsSum);
        } catch (error: any) {
          setHistoryError(error.message);
        } finally {
          setIsLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [isAuthenticated, authenticatedFetch, t]); // Dependencias para fetchHistory

  const handleSavePreferences = async () => {
    if (!authenticatedFetch || !preferences) return;
    setIsSavingPreferences(true);
    try {
      const preferencesToSave: UserPreferences = {};
      if (selectedTheme !== (preferences.theme_preference || "system")) {
        preferencesToSave.theme_preference = selectedTheme;
      }
      if (
        selectedLoginRedirect !== (preferences.login_redirect_preference || "/")
      ) {
        preferencesToSave.login_redirect_preference = selectedLoginRedirect;
      }

      if (Object.keys(preferencesToSave).length === 0) {
        toast({ title: t("preferences.noChanges") });
        setIsSavingPreferences(false);
        return;
      }

      const response = await authenticatedFetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferencesToSave),
      });
      if (!response.ok) throw new Error(t("preferences.saveError"));

      const updatedPrefsData = await response.json();
      const savedPreferences = updatedPrefsData.preferences as UserPreferences;

      // 1. Aplicar el tema visualmente
      if (savedPreferences?.theme_preference) {
        setTheme(savedPreferences.theme_preference);
        // 2. Actualizar el estado local para que la UI del RadioGroup refleje el cambio
        setSelectedTheme(savedPreferences.theme_preference);
      }
      if (savedPreferences?.login_redirect_preference) {
        setSelectedLoginRedirect(savedPreferences.login_redirect_preference);
      }

      // 3. Actualizar IndexedDB para que useHiveAuth lo recoja en la próxima carga/actualización
      const currentStoredPrefs =
        (await getIndexedDbItem<UserPreferences>("currentUserPreferences")) ||
        {};
      await setIndexedDbItem("currentUserPreferences", {
        ...currentStoredPrefs,
        ...savedPreferences,
      });

      toast({ title: t("preferences.saveSuccess") });
    } catch (error: any) {
      toast({
        title: t("errors.error"), // Asegúrate que esta clave exista en ProfilePage o usa una global
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size={32} />
          <p className="ml-2">{t("loadingProfile")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>{t("accessDenied")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
        {hiveUsername ? (
          <div className="flex items-center gap-2 text-lg">
            <span>{t("welcomeMessage", { username: hiveUsername })}</span>
            {userRole === "admin" && (
              <span
                title={t("adminUserTooltip")}
                className="flex items-center text-blue-600"
              >
                <Shield className="h-5 w-5" />
              </span>
            )}
          </div>
        ) : (
          <p>{t("loadingUserData")}</p>
        )}
      </div>

      <hr className="my-6 border-border" />

      <div>
        <h2 className="text-xl font-semibold mb-4">{t("preferences.title")}</h2>
        <div className="space-y-6 mb-8 p-4 border rounded-lg">
          {/* Theme Preference */}
          <div>
            <Label className="text-md font-medium">
              {t("preferences.theme.label")}
            </Label>
            <RadioGroup
              value={selectedTheme}
              onValueChange={(value: string) => {
                setSelectedTheme(value as UserPreferences["theme_preference"]);
              }}
              className="mt-2 space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="theme-light" />
                <Label htmlFor="theme-light">
                  {t("preferences.theme.light")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label htmlFor="theme-dark">
                  {t("preferences.theme.dark")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="theme-system" />
                <Label htmlFor="theme-system">
                  {t("preferences.theme.system")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-md font-medium">
              {t("preferences.loginRedirect.label")}
            </Label>
            <RadioGroup
              value={selectedLoginRedirect}
              onValueChange={(value: string) => {
                setSelectedLoginRedirect(
                  value as UserPreferences["login_redirect_preference"]
                );
              }}
              className="mt-2 space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="/" id="redirect-home" />
                <Label htmlFor="redirect-home">
                  {t("preferences.loginRedirect.home")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="/editor" id="redirect-editor" />
                <Label htmlFor="redirect-editor">
                  {t("preferences.loginRedirect.editor")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            onClick={handleSavePreferences}
            disabled={isSavingPreferences}
          >
            {isSavingPreferences ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                {t("preferences.saving")}
              </>
            ) : (
              t("preferences.saveButton")
            )}
          </Button>
        </div>
      </div>

      <hr className="my-6 border-border" />

      <div>
        <h2 className="text-xl font-semibold mb-3">
          {t("tokenUsageHistory.title")}
        </h2>
        {!isLoadingHistory && !historyError && tokenUsageHistory.length > 0 && (
          <div className="mb-4 p-4 border rounded-lg bg-muted/50">
            <h3 className="text-md font-semibold mb-2">
              {t("tokenUsageHistory.summaryTitle")}
            </h3>
            <div className="space-y-1 text-sm">
              <p>
                {t("tokenUsageHistory.totalTextTokens")}:{" "}
                <span className="font-bold">
                  {totalTextTokensUsed.toLocaleString()}
                </span>
              </p>
              <p>
                {t("tokenUsageHistory.totalImageUnits")}:{" "}
                <span className="font-bold">
                  {totalImageUnitsUsed.toLocaleString()}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {t("tokenUsageHistory.summaryNote")}
              </p>
            </div>
          </div>
        )}

        {isLoadingHistory && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size={32} />
            <p className="ml-2">{t("tokenUsageHistory.loading")}</p>
          </div>
        )}
        {historyError && (
          <p className="text-destructive">
            {t("tokenUsageHistory.error", { error: historyError })}
          </p>
        )}
        {!isLoadingHistory &&
          !historyError &&
          tokenUsageHistory.length === 0 && (
            <p className="text-muted-foreground">
              {t("tokenUsageHistory.noHistory")}
            </p>
          )}
        {!isLoadingHistory && !historyError && tokenUsageHistory.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tokenUsageHistory.headerTimestamp")}</TableHead>
                <TableHead>{t("tokenUsageHistory.headerOperation")}</TableHead>
                <TableHead>{t("tokenUsageHistory.headerModel")}</TableHead>
                <TableHead className="text-right">
                  {t("tokenUsageHistory.headerTextTokens")}
                </TableHead>
                <TableHead className="text-right">
                  {t("tokenUsageHistory.headerImageUnits")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokenUsageHistory.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {new Date(record.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>{record.operation_type}</TableCell>
                  <TableCell>{record.model_used || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    {record.text_tokens_used?.toLocaleString() ||
                      record.details_json?.totalTokenCount?.toLocaleString() ||
                      "0"}
                  </TableCell>
                  <TableCell className="text-right">
                    {record.image_tokens_used?.toLocaleString() || "0"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
