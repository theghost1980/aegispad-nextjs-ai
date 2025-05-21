"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGeminiKeyManager } from "@/hooks/use-gemini-key-manager";
import { useHiveAuth } from "@/hooks/use-hive-auth";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Shield, // Importamos un icono para el admin
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import posthog from "posthog-js"; // Importar posthog-js
import { FormEvent, useCallback, useEffect, useState } from "react";

interface GeminiApiKeyResponse {
  encryptedApiKey: string | null;
}

export default function ProfilePage() {
  const t = useTranslations("ProfilePage");
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    hiveUsername,
    userRole, // Obtenemos el rol del usuario
    authenticatedFetch, // <-- ¡Añadir authenticatedFetch aquí!
  } = useHiveAuth();
  const [isGeminiKeyConfigured, setIsGeminiKeyConfigured] =
    useState<boolean>(false);
  const [isApiKeyLoading, setIsApiKeyLoading] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [newApiKeyInput, setNewApiKeyInput] = useState("");
  const [showNewApiKey, setShowNewApiKey] = useState(false);
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [testApiKeyResult, setTestApiKeyResult] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [saveApiKeyError, setSaveApiKeyError] = useState<string | null>(null);
  const [saveApiKeySuccess, setSaveApiKeySuccess] = useState<string | null>(
    null
  );
  const [encryptedClientPreview, setEncryptedClientPreview] = useState<
    string | null
  >(null);
  const [fetchedEncryptedKey, setFetchedEncryptedKey] = useState<string | null>(
    null
  );
  const [showFetchedEncryptedKey, setShowFetchedEncryptedKey] =
    useState<boolean>(false);

  const { authToken } = useHiveAuth();
  const { encodeData, saveApiKeyToBackend } = useGeminiKeyManager();

  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  const fetchGeminiApiKey = useCallback(async () => {
    if (!hiveUsername) {
      setIsGeminiKeyConfigured(false);
      return;
    }

    if (!authToken) {
      setIsGeminiKeyConfigured(false);
      return;
    }

    setIsApiKeyLoading(true);
    setApiKeyError(null);
    try {
      // Usar authenticatedFetch que maneja la refresco del token automáticamente
      const response = await authenticatedFetch("/api/user/gemini-key");

      if (!response.ok) {
        // authenticatedFetch ya lanza un error si la respuesta no es ok después de intentar refrescar
        // Si llega aquí, es un error 401/403 después del refresco, o cualquier otro error HTTP
        const errorData = await response
          .json()
          .catch(() => ({ message: t("errorFetchingApiKey") }));
        // Si el status es 404, significa que la clave no existe, no es un error de auth
        if (response.status === 404) {
          setIsGeminiKeyConfigured(false);
        } else {
          throw new Error(errorData.message || t("errorFetchingApiKey"));
        }
      } else {
        const data: GeminiApiKeyResponse = await response.json();
        setFetchedEncryptedKey(data.encryptedApiKey);
        setIsGeminiKeyConfigured(!!data.encryptedApiKey);
      }
    } catch (error: any) {
      console.error("Error fetching Gemini API key:", error);
      setApiKeyError(error.message || t("errorFetchingApiKey"));
      setIsGeminiKeyConfigured(false);
      setFetchedEncryptedKey(null);
    } finally {
      setIsApiKeyLoading(false);
    }
  }, [hiveUsername, authenticatedFetch, t]); // Actualizar dependencias

  useEffect(() => {
    if (isAuthenticated && hiveUsername) {
      fetchGeminiApiKey();
    }
  }, [isAuthenticated, hiveUsername, fetchGeminiApiKey]);

  const handleTestApiKey = async () => {
    if (!newApiKeyInput.trim()) {
      setTestApiKeyResult({
        isValid: false,
        message: t("apiKeyCannotBeEmpty"),
      });
      return;
    }
    setIsTestingApiKey(true);
    setTestApiKeyResult(null);
    setSaveApiKeyError(null);
    setSaveApiKeySuccess(null);
    setEncryptedClientPreview(null);

    try {
      const response = await fetch("/api/ai/validate-gemini-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: newApiKeyInput }),
      });
      const data = await response.json();
      if (!response.ok) {
        setTestApiKeyResult({
          isValid: false,
          message: data.error || data.message || t("testApiKeyFailedGeneric"),
        });
      } else {
        if (data.isValid) {
          if (hiveUsername) {
            try {
              const encrypted = await encodeData(hiveUsername, newApiKeyInput);
              setEncryptedClientPreview(encrypted);
              setTestApiKeyResult({
                isValid: true,
                message: t("testApiKeySuccess"),
              });
            } catch (encError) {
              console.error("Error encrypting API key for preview:", encError);
              setEncryptedClientPreview(null);
              setTestApiKeyResult({
                isValid: true,
                message: t("testApiKeySuccessButPreviewError"),
              });
            }
          } else {
            setEncryptedClientPreview(null);
            setTestApiKeyResult({
              isValid: true,
              message: t("testApiKeySuccessButPreviewError"),
            });
          }
        } else {
          setTestApiKeyResult({
            isValid: false,
            message: data.error || t("testApiKeyFailed"),
          });
          setEncryptedClientPreview(null);
        }
      }
    } catch (error) {
      console.error("Error testing API key:", error);
      setTestApiKeyResult({
        isValid: false,
        message: t("testApiKeyFailedGeneric"),
      });
    } finally {
      setIsTestingApiKey(false);
    }
  };

  const handleSaveApiKey = async (event: FormEvent) => {
    //TODO need to check if apiKey already found in users?
    event.preventDefault();
    if (
      !newApiKeyInput.trim() ||
      !testApiKeyResult?.isValid ||
      !encryptedClientPreview
    ) {
      setSaveApiKeyError(t("cannotSaveInvalidKey"));
      return;
    }
    if (!hiveUsername) {
      setSaveApiKeyError(t("errorUserNotAuthenticatedForApi"));
      return;
    }
    setIsSavingApiKey(true);
    setSaveApiKeyError(null);
    setSaveApiKeySuccess(null);

    try {
      const success = await saveApiKeyToBackend(
        encryptedClientPreview,
        hiveUsername,
        true
      );
      if (success) {
        setSaveApiKeySuccess(t("saveApiKeySuccess"));
        setIsGeminiKeyConfigured(true);
        setShowApiKeyForm(false);
        setNewApiKeyInput("");
        setTestApiKeyResult(null);
        await fetchGeminiApiKey();
        setEncryptedClientPreview(null);

        if (hiveUsername) {
          posthog.capture("gemini_api_key_saved", { username: hiveUsername });
        }
      } else {
        setSaveApiKeyError(t("saveApiKeyFailedGeneric"));
      }
    } catch (error: any) {
      console.error("Error saving API key:", error);
      setSaveApiKeyError(error.message || t("saveApiKeyFailedGeneric"));
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const getApiKeyDisplayStatus = () => {
    if (isGeminiKeyConfigured) return t("apiKeyConfiguredStatus");
    return t("noApiKeyConfigured");
  };

  if (isAuthLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>{t("loadingProfile")}</p>
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
        <h2 className="text-xl font-semibold mb-3">
          {t("geminiApiKeySectionTitle")}
        </h2>
        {isApiKeyLoading && (
          <p className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("loadingApiKey")}
          </p>
        )}
        {apiKeyError && <p className="text-destructive">{apiKeyError}</p>}

        {!isApiKeyLoading && !apiKeyError && (
          <>
            {!showApiKeyForm ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-muted-foreground" />
                  <p className="text-md">
                    {t("currentApiKeyStatus")}:{" "}
                    <span
                      className={`font-semibold px-2 py-1 rounded text-sm ${
                        isGeminiKeyConfigured
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {getApiKeyDisplayStatus()}
                    </span>
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setShowApiKeyForm(true);
                    setNewApiKeyInput("");
                    setTestApiKeyResult(null);
                    setSaveApiKeyError(null);
                    setSaveApiKeySuccess(null);
                  }}
                >
                  {isGeminiKeyConfigured
                    ? t("updateApiKeyButton")
                    : t("addApiKeyButton")}
                </Button>
                {isGeminiKeyConfigured && fetchedEncryptedKey && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setShowFetchedEncryptedKey(!showFetchedEncryptedKey)
                      }
                    >
                      {showFetchedEncryptedKey
                        ? t("hideStoredKeyButton")
                        : t("viewStoredKeyButton")}
                    </Button>
                    {showFetchedEncryptedKey && (
                      <div className="mt-2 p-3 bg-muted border rounded-md">
                        <p className="text-sm font-medium text-foreground">
                          {t("storedEncryptedKeyLabel")}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground break-all bg-background p-2 rounded mt-1">
                          {fetchedEncryptedKey}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <form
                onSubmit={handleSaveApiKey}
                className="space-y-4 p-4 border rounded-lg bg-card shadow"
              >
                <h3 className="text-lg font-medium">
                  {isGeminiKeyConfigured
                    ? t("formTitleUpdate")
                    : t("formTitleAdd")}
                </h3>
                <div>
                  <label
                    htmlFor="geminiApiKeyInput"
                    className="block text-sm font-medium text-muted-foreground mb-1"
                  >
                    {t("newApiKeyLabel")}
                  </label>
                  <div className="relative">
                    <Input
                      id="geminiApiKeyInput"
                      type={showNewApiKey ? "text" : "password"}
                      value={newApiKeyInput}
                      onChange={(e) => {
                        setNewApiKeyInput(e.target.value);
                        setTestApiKeyResult(null);
                        setSaveApiKeyError(null);
                        setEncryptedClientPreview(null);
                        setSaveApiKeySuccess(null);
                      }}
                      placeholder={t("apiKeyPlaceholder")}
                      className="pr-10"
                      disabled={isTestingApiKey || isSavingApiKey}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowNewApiKey(!showNewApiKey)}
                      aria-label={
                        showNewApiKey ? t("hideApiKey") : t("showApiKey")
                      }
                    >
                      {showNewApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("apiKeySecurityNoteForm")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t.rich("getNewApiKeyLink", {
                      link: (chunks) => (
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {chunks}
                        </a>
                      ),
                    })}
                  </p>
                </div>

                {testApiKeyResult && (
                  <div
                    className={`flex items-center gap-2 text-sm p-2 rounded-md ${
                      testApiKeyResult.isValid
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {testApiKeyResult.isValid ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : (
                      <ShieldX className="h-5 w-5" />
                    )}
                    {testApiKeyResult.message}
                  </div>
                )}

                {testApiKeyResult?.isValid && encryptedClientPreview && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm font-medium text-blue-700">
                      {t("encryptedPreviewLabel")}
                    </p>
                    <p className="font-mono text-xs text-blue-600 break-all bg-blue-100 p-2 rounded mt-1">
                      {encryptedClientPreview}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    onClick={handleTestApiKey}
                    disabled={
                      isTestingApiKey ||
                      isSavingApiKey ||
                      !newApiKeyInput.trim()
                    }
                  >
                    {isTestingApiKey && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("testApiKeyButton")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isSavingApiKey ||
                      isTestingApiKey ||
                      !testApiKeyResult?.isValid ||
                      !newApiKeyInput.trim()
                    }
                  >
                    {isSavingApiKey && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("saveApiKeyButton")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowApiKeyForm(false);
                      setNewApiKeyInput("");
                      setTestApiKeyResult(null);
                      setSaveApiKeyError(null);
                      setEncryptedClientPreview(null);
                      setSaveApiKeySuccess(null);
                    }}
                    disabled={isSavingApiKey || isTestingApiKey}
                  >
                    {t("cancelButton")}
                  </Button>
                </div>
                {saveApiKeyError && (
                  <p className="text-sm text-destructive">{saveApiKeyError}</p>
                )}
                {saveApiKeySuccess && (
                  <p className="text-sm text-green-600">{saveApiKeySuccess}</p>
                )}
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
