"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface ApiKeyInputStepProps {
  onSubmit: (apiKey: string) => Promise<void>;
  onGoToApiKeyInfo: () => void;
  isLoading: boolean;
  errorMessage: string | null;
  hiveUsername: string; // Para mostrar en el mensaje de seguridad
}

export default function ApiKeyInputStep({
  onSubmit,
  onGoToApiKeyInfo,
  isLoading,
  errorMessage,
  hiveUsername,
}: ApiKeyInputStepProps) {
  const t = useTranslations("OnboardingAssistant.ApiKeyInputStep");
  const [apiKey, setApiKey] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSubmit(apiKey.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-semibold">{t("title")}</h2>
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>{t("securityNoteTitle")}</AlertTitle>
        <AlertDescription>
          {t("securityNoteDescription", { username: hiveUsername })}
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="gemini-api-key">{t("apiKeyLabel")}</Label>
        <Input
          id="gemini-api-key"
          type="password" // Para ocultar la clave mientras se escribe
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={t("apiKeyPlaceholder")}
          disabled={isLoading}
          required
        />
        <p className="text-xs text-muted-foreground">{t("apiKeyHint")}</p>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("errorTitle")}</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          type="submit"
          disabled={isLoading || !apiKey.trim()}
          className="flex-1"
        >
          {isLoading ? t("testingAndSavingButton") : t("saveAndTestButton")}
        </Button>
        <Button
          onClick={onGoToApiKeyInfo}
          variant="outline"
          type="button"
          className="flex-1"
        >
          {t("howToGetApiKeyButton")}
        </Button>
      </div>
    </form>
  );
}
