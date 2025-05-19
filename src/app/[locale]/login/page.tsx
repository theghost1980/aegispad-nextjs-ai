"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Para mensajes
import { Button } from "@/components/ui/button"; // Asumiendo que usas shadcn/ui Button
import { Input } from "@/components/ui/input"; // Asumiendo que usas shadcn/ui Input
import { useHiveAuth } from "@/hooks/use-hive-auth";
import { Terminal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
  const t = useTranslations("LoginPage");
  const router = useRouter();
  const {
    login,
    isAuthenticated,
    isLoading: isAuthLoading, // Loading general de autenticación
    isKeychainAvailable,
    isLoadingKeychain,
    error: authError, // Error general de autenticación
  } = useHiveAuth();

  const [usernameInput, setUsernameInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState<string | null>(
    null
  );

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      setLoginSuccessMessage(t("redirecting"));
      setTimeout(() => router.push("/profile"), 1500); // Redirigir a perfil o dashboard
    }
  }, [isAuthenticated, isAuthLoading, router, t]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!usernameInput.trim()) {
      setFormError(t("usernameRequired"));
      return;
    }
    if (!isKeychainAvailable) {
      setFormError(t("keychainNotAvailable"));
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setLoginSuccessMessage(null);

    try {
      const success = await login(usernameInput.trim());
      if (success) {
        setLoginSuccessMessage(t("loginSuccess"));
        // La redirección la maneja el useEffect de arriba al cambiar isAuthenticated
      } else {
        // El error específico debería venir del hook useHiveAuth si login falla
        setFormError(authError || t("anErrorOccurred"));
      }
    } catch (e: any) {
      setFormError(e.message || t("anErrorOccurred"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isLoadingKeychain) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>{t("loadingPage")}</p>
      </div>
    );
  }

  // Si ya está autenticado y el useEffect está por redirigir, no mostrar el form.
  if (isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        {loginSuccessMessage && <p>{loginSuccessMessage}</p>}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-center">{t("title")}</h1>

        {!isKeychainAvailable && !isLoadingKeychain && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>{t("keychainErrorTitle")}</AlertTitle>
            <AlertDescription>{t("keychainNotAvailable")}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="hiveUsername" className="sr-only">
              {t("usernameLabel")}
            </label>
            <Input
              id="hiveUsername"
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder={t("usernamePlaceholder")}
              disabled={isSubmitting || !isKeychainAvailable}
              required
            />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          {loginSuccessMessage && (
            <p className="text-sm text-green-600">{loginSuccessMessage}</p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !isKeychainAvailable || isLoadingKeychain}
          >
            {isSubmitting ? t("loggingIn") : t("loginButton")}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          {t("keychainPrompt")}
        </p>
      </div>
    </div>
  );
}
