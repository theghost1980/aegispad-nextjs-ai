"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HIVE_KEYCHAIN_INSTALL_URL } from "@/constants/constants";
import { useTranslations } from "next-intl";
import Link from "next/link"; // Usar Link de next/link para enlaces externos
import { useState } from "react";

interface HiveLoginStepProps {
  onLoginAttempt: (username: string) => Promise<void>;
  onGoToAccountInfo: () => void;
  isLoading: boolean;
  errorMessage: string | null;
  isKeychainAvailable: boolean;
}

export default function HiveLoginStep({
  onLoginAttempt,
  onGoToAccountInfo,
  isLoading,
  errorMessage,
  isKeychainAvailable,
}: HiveLoginStepProps) {
  const t = useTranslations("OnboardingAssistant.HiveLoginStep");
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLoginAttempt(username.trim());
    }
  };

  if (!isKeychainAvailable) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-destructive">{t("keychainNotDetected")}</p>
        <p>
          {t.rich("installKeychainPrompt", {
            link: (chunks) => (
              <Link
                href={HIVE_KEYCHAIN_INSTALL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary hover:text-primary/80"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
        <Button onClick={onGoToAccountInfo} variant="outline">
          {t("learnToCreateAccountButton")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-semibold">{t("title")}</h2>
      <p>{t("description")}</p>
      <div className="space-y-2">
        <Label htmlFor="hive-username">{t("usernameLabel")}</Label>
        <Input
          id="hive-username"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder={t("usernamePlaceholder")}
          disabled={isLoading}
          required
        />
      </div>
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          type="submit"
          disabled={isLoading || !username.trim()}
          className="flex-1"
        >
          {isLoading ? t("loggingInButton") : t("loginButton")}
        </Button>
        <Button
          onClick={onGoToAccountInfo}
          variant="outline"
          type="button"
          className="flex-1"
        >
          {t("howToCreateAccountButton")}
        </Button>
      </div>
    </form>
  );
}
