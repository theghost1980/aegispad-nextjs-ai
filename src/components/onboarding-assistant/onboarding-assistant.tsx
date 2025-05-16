"use client";

import { useGeminiKeyManager } from "@/hooks/use-gemini-key-manager";
import { useHiveAuth } from "@/hooks/use-hive-auth";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import ApiKeyInfoStep from "./steps/api-key-info-step";
import ApiKeyInputStep from "./steps/api-key-input-step";
import CompletedStep from "./steps/completed-step"; // Importar el nuevo componente
import HiveAccountInfoStep from "./steps/hive-account-info-step";
import HiveLoginStep from "./steps/hive-login-step";
import ReportStep from "./steps/report-step";
export type OnboardingStep = // No hay cambios en este tipo

    | "initialCheck"
    | "hiveLogin"
    | "hiveAccountInfo"
    | "apiKeyInput"
    | "apiKeyInfo"
    // | "testingApiKey" // Este estado podría manejarse dentro de ApiKeyInputStep
    | "report"
    | "completed";

interface OnboardingAssistantProps {
  onComplete?: () => void;
  // Props opcionales para personalizar enlaces, si es necesario en el futuro
  // hiveCreateAccountLinks?: { label: string; url: string }[];
  // geminiApiKeyInfoLink?: string;
}

export default function OnboardingAssistant({
  onComplete,
}: OnboardingAssistantProps) {
  const t = useTranslations("OnboardingAssistant");
  const tErrors = useTranslations("Errors");
  const locale = useLocale();

  const {
    login: hiveLogin,
    // logout: hiveLogout, // No se usa directamente en el flujo inicial
    isLoggedIn: isHiveLoggedIn,
    storedUsername: hiveUsername,
    isLoadingKeychain: isLoadingHiveKeychain,
    isKeychainAvailable: isHiveKeychainAvailable,
  } = useHiveAuth();

  const {
    testApiKey,
    encodeData: encryptApiKey,
    // decodeData: decryptApiKey, // No se usa directamente en el flujo inicial
    storeEncryptedApiKey,
    // getStoredEncryptedApiKey, // No se usa directamente
    hasStoredApiKey,
    // clearStoredApiKey, // No se usa directamente
    isLoadingKeychain: isLoadingGeminiKeychainCheck, // Puede ser el mismo que isLoadingHiveKeychain
  } = useGeminiKeyManager();

  const [currentStep, setCurrentStep] =
    useState<OnboardingStep>("initialCheck");
  // const [apiKeyInputValue, setApiKeyInputValue] = useState(""); // Se manejará en ApiKeyInputStep
  const [currentHiveUsername, setCurrentHiveUsername] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reportData, setReportData] = useState<{
    date: string;
    username: string;
    apiKeyStatus: string;
  } | null>(null);

  useEffect(() => {
    // Sincronizar el nombre de usuario del hook con el estado local del asistente
    if (hiveUsername) {
      setCurrentHiveUsername(hiveUsername);
    }
  }, [hiveUsername]);

  useEffect(() => {
    if (
      currentStep === "initialCheck" &&
      !isLoadingHiveKeychain &&
      !isLoadingGeminiKeychainCheck // Asegurarse de que ambas comprobaciones de keychain hayan terminado
    ) {
      if (isHiveLoggedIn() && hasStoredApiKey()) {
        // Usuario ya configurado, idealmente generar reporte y mostrarlo o permitir reconfigurar
        console.log("User already configured.");
        const username = hiveUsername || tErrors("notAvailable");
        setReportData({
          date: new Date().toLocaleString(locale, {
            dateStyle: "long",
            timeStyle: "short",
          }),
          username: username,
          apiKeyStatus: t("reportMessages.apiKeyOkAndStored"),
        });
        setCurrentStep("report");
      } else if (!isHiveLoggedIn()) {
        setCurrentStep("hiveLogin");
      } else {
        // Logueado en Hive pero sin API key
        setCurrentStep("apiKeyInput");
      }
    }
  }, [
    currentStep,
    isHiveLoggedIn,
    hasStoredApiKey,
    isLoadingHiveKeychain,
    isLoadingGeminiKeychainCheck,
    onComplete,
    t, // Añadir t como dependencia si se usa para generar reportData
  ]);

  const handleHiveLoginAttempt = async (username: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    const result = await hiveLogin(username);
    if ("username" in result && result.username) {
      setCurrentHiveUsername(result.username); // Actualizar el nombre de usuario aquí
      setCurrentStep("apiKeyInput"); // Siguiente paso: pedir API key
    } else {
      // Usar type guard para verificar si 'result' es el tipo de error
      if ("error" in result) {
        if (result.error === "keychainNotAvailable") {
          setCurrentStep("hiveAccountInfo");
        } else {
          // Acceder a result.message solo si 'error' existe
          setErrorMessage(result.message || tErrors("hiveLoginFailed"));
        }
      }
    }
    setIsLoading(false);
  };

  const handleApiKeySubmitAttempt = async (apiKey: string) => {
    if (!currentHiveUsername) {
      setErrorMessage(tErrors("hiveUsernameMissing"));
      setCurrentStep("hiveLogin"); // Forzar a re-loguear si no hay username
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    const testResult = await testApiKey(apiKey);

    if (testResult.isValid) {
      try {
        const encryptedKey = await encryptApiKey(currentHiveUsername, apiKey);
        storeEncryptedApiKey(encryptedKey);
        setReportData({
          date: new Date().toLocaleString(locale, {
            dateStyle: "long",
            timeStyle: "short",
          }),
          username: currentHiveUsername,
          apiKeyStatus: t("reportMessages.apiKeyOk"),
        });
        setCurrentStep("report");
      } catch (encError: any) {
        setErrorMessage(
          tErrors("apiKeyEncryptionFailed", {
            error: encError.message || String(encError),
          })
        );
      }
    } else {
      setErrorMessage(testResult.error || tErrors("apiKeyInvalid"));
    }
    setIsLoading(false);
  };

  if (
    currentStep === "initialCheck" ||
    isLoadingHiveKeychain ||
    isLoadingGeminiKeychainCheck
  ) {
    return <div>{t("loadingAssistant")}</div>;
  }

  switch (currentStep) {
    case "hiveLogin":
      return (
        <HiveLoginStep
          onLoginAttempt={handleHiveLoginAttempt}
          onGoToAccountInfo={() => setCurrentStep("hiveAccountInfo")}
          isLoading={isLoading}
          errorMessage={errorMessage}
          isKeychainAvailable={isHiveKeychainAvailable}
        />
      );
    case "hiveAccountInfo":
      return (
        <HiveAccountInfoStep
          onGoBackToLogin={() => setCurrentStep("hiveLogin")}
        />
      );
    case "apiKeyInput":
      if (!currentHiveUsername) {
        setCurrentStep("hiveLogin"); // Safeguard
        return <div>{tErrors("hiveUsernameMissing")}</div>;
      }
      return (
        <ApiKeyInputStep
          onSubmit={handleApiKeySubmitAttempt}
          onGoToApiKeyInfo={() => setCurrentStep("apiKeyInfo")}
          isLoading={isLoading}
          errorMessage={errorMessage}
          hiveUsername={currentHiveUsername}
        />
      );
    case "apiKeyInfo":
      return (
        <ApiKeyInfoStep onGoBackToInput={() => setCurrentStep("apiKeyInput")} />
      );
    case "report":
      if (!reportData) return <div>{tErrors("reportDataMissing")}</div>;
      return (
        <ReportStep
          reportDate={reportData.date}
          hiveUsername={reportData.username}
          apiKeyStatus={reportData.apiKeyStatus}
          onComplete={() => {
            setCurrentStep("completed");
            if (onComplete) onComplete();
          }}
        />
      );
    case "completed":
      return <CompletedStep onGetStarted={onComplete} />;
    default:
      return <div>{tErrors("unknownError")}</div>;
  }
}
