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
    login, // Esta es la función de login actualizada
    hiveUsername, // Del AppContext, actualizado por useHiveAuth
    isAuthenticated,
    isLoading: isLoadingHiveAuth, // Estado de carga general del hook de auth
    error: hiveAuthError,
    isKeychainAvailable: isHiveKeychainAvailable,
    setError: setHiveAuthError,
  } = useHiveAuth();

  const {
    testApiKey,
    saveApiKeyToBackend,
    checkIfApiKeyIsConfigured,
    clearApiKeyFromBackend, // Podría ser útil para un "reset"
    isLoading: isLoadingGemini, // Estado de carga general del hook de gemini
    error: geminiError,
    setError: setGeminiError,
  } = useGeminiKeyManager();

  const [currentStep, setCurrentStep] =
    useState<OnboardingStep>("initialCheck");
  // const [apiKeyInputValue, setApiKeyInputValue] = useState(""); // Se manejará en ApiKeyInputStep
  const [currentHiveUsername, setCurrentHiveUsername] = useState<string | null>(
    null
  );
  const [isStepLoading, setIsStepLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reportData, setReportData] = useState<{
    date: string;
    username: string;
    apiKeyStatus: string;
  } | null>(null);

  useEffect(() => {
    // Solo actualizar si es diferente para evitar re-renders innecesarios
    if (hiveUsername && hiveUsername !== currentHiveUsername) {
      setCurrentHiveUsername(hiveUsername);
    } else if (!hiveUsername && currentHiveUsername !== null) {
      setCurrentHiveUsername(null);
    }
  }, [hiveUsername, currentHiveUsername]);

  useEffect(() => {
    if (
      currentStep === "initialCheck" &&
      !isLoadingHiveAuth &&
      !isLoadingGemini
    ) {
      console.log("[Onboarding InitialCheck] Running initial check...");
      const performInitialCheck = async () => {
        setIsStepLoading(true);
        const isApiKeyConfigured = isAuthenticated
          ? await checkIfApiKeyIsConfigured()
          : false;
        if (isAuthenticated && isApiKeyConfigured) {
          console.log("[Onboarding] User already configured.");
          // Asegurarnos de que hiveUsername (del contexto) esté disponible
          // Si no, esperar a que se propague o usar un valor temporal si es solo para el reporte.
          // Pero para la lógica de flujo, isAuthenticated es la clave.
          const usernameForReport =
            hiveUsername || currentHiveUsername || tErrors("notAvailable");
          setReportData({
            date: new Date().toLocaleString(locale, {
              dateStyle: "long",
              timeStyle: "short",
            }),
            username: usernameForReport,
            apiKeyStatus: t("reportMessages.apiKeyOkAndStored"),
          });
          setCurrentStep("report");
        } else if (!isAuthenticated) {
          console.log(
            "[Onboarding InitialCheck] User not authenticated. Going to hiveLogin."
          );
          setCurrentStep("hiveLogin");
        } else {
          console.log(
            "[Onboarding InitialCheck] Authenticated but API key not configured. Going to apiKeyInput."
          );
          setCurrentStep("apiKeyInput");
        }
        setIsStepLoading(false);
      };
      performInitialCheck();
    }
  }, [
    currentStep,
    isAuthenticated,
    checkIfApiKeyIsConfigured,
    isLoadingHiveAuth,
    isLoadingGemini,
    hiveUsername,
    onComplete,
    t,
    locale,
    tErrors,
  ]);

  const handleHiveLoginAttempt = async (username: string) => {
    setIsStepLoading(true);
    setErrorMessage(null);
    if (hiveAuthError) setHiveAuthError(null);

    const loginSuccess = await login(username);

    if (loginSuccess) {
      // Login exitoso. Ahora verificar si la API key ya está configurada.
      // hiveUsername (del contexto) debería estar actualizado por el hook 'login'
      // Esperar un breve momento para que el contexto se propague si es necesario,
      // o confiar en que checkIfApiKeyIsConfigured usará el estado más reciente.
      const userForCheck = hiveUsername || username;
      console.log("[Onboarding] Hive login success for:", userForCheck);

      setIsStepLoading(true); // Indicar carga para la comprobación de la API key
      const isKeyAlreadyConfigured = await checkIfApiKeyIsConfigured();
      // No necesitamos setIsStepLoading(false) aquí inmediatamente si el siguiente paso también carga
      if (isKeyAlreadyConfigured) {
        setIsStepLoading(false); // Termina la carga aquí si vamos a report
        console.log(
          "[Onboarding] API key already configured. Going to report."
        );
        setReportData({
          date: new Date().toLocaleString(locale, {
            dateStyle: "long",
            timeStyle: "short",
          }),
          username: userForCheck,
          apiKeyStatus: t("reportMessages.apiKeyOkAndStored"),
        });
        setCurrentStep("report");
      } else {
        console.log(
          "[Onboarding] API key not configured. Going to apiKeyInput."
        );
        setCurrentStep("apiKeyInput");
      }
    } else {
      setErrorMessage(hiveAuthError || tErrors("hiveLoginFailed"));
      if (
        hiveAuthError === "Hive Keychain is not installed or available." ||
        !isHiveKeychainAvailable
      ) {
        setCurrentStep("hiveAccountInfo");
      }
    }
    // Asegurarse de que isStepLoading se ponga en false si no se cambió de paso
    // o si el nuevo paso no tiene su propio indicador de carga.
    if (currentStep !== "report" && currentStep !== "apiKeyInput")
      setIsStepLoading(false);
  };

  const handleApiKeySubmitAttempt = async (apiKey: string) => {
    // Asegurarse de que currentHiveUsername (que viene del contexto via useEffect) esté seteado
    // O mejor, usar directamente hiveUsername del contexto si ya está disponible y es la fuente de verdad.
    const usernameForApiKey = hiveUsername || currentHiveUsername;
    if (!usernameForApiKey) {
      setErrorMessage(tErrors("hiveUsernameMissing"));
      // Podríamos forzar a re-loguear, o simplemente mostrar el error y no proceder.
      // setCurrentStep("hiveLogin");
      return;
    }
    setErrorMessage(null);
    setIsStepLoading(true);
    if (geminiError) setGeminiError(null);
    const saveSuccess = await saveApiKeyToBackend(apiKey, usernameForApiKey);
    if (saveSuccess) {
      setReportData({
        date: new Date().toLocaleString(locale, {
          dateStyle: "long",
          timeStyle: "short",
        }),
        username: usernameForApiKey,
        apiKeyStatus: t("reportMessages.apiKeyOk"),
      });
      setCurrentStep("report");
    } else {
      // El error debería estar en geminiError del hook
      setErrorMessage(geminiError || tErrors("apiKeySaveFailed"));
    }
    setIsStepLoading(false);
  };

  const combinedIsLoading =
    isStepLoading || isLoadingHiveAuth || isLoadingGemini;

  if (
    currentStep === "initialCheck" ||
    isLoadingHiveAuth || // Si el hook de auth está cargando inicialmente
    isLoadingGemini // Si el hook de gemini está cargando inicialmente
  ) {
    return <div>{t("loadingAssistant")}</div>;
  }

  switch (currentStep) {
    case "hiveLogin":
      return (
        <HiveLoginStep
          onLoginAttempt={handleHiveLoginAttempt}
          onGoToAccountInfo={() => setCurrentStep("hiveAccountInfo")}
          isLoading={combinedIsLoading}
          errorMessage={errorMessage || hiveAuthError} // Mostrar error local o del hook
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
      const usernameForApiKeyStep = hiveUsername || currentHiveUsername;
      if (!isAuthenticated || !usernameForApiKeyStep) {
        // Chequeo más robusto
        // Este caso debería ser raro si el flujo es correcto y isAuthenticated es true
        console.warn(
          "[Onboarding] Attempted to go to apiKeyInput without a valid username or auth. Forcing to hiveLogin."
        );
        setCurrentStep("hiveLogin"); // Safeguard
        return <div>{tErrors("hiveUsernameMissing")}</div>;
      }
      return (
        <ApiKeyInputStep
          onSubmit={handleApiKeySubmitAttempt}
          onGoToApiKeyInfo={() => setCurrentStep("apiKeyInfo")}
          isLoading={combinedIsLoading}
          errorMessage={errorMessage || geminiError} // Mostrar error local o del hook
          hiveUsername={usernameForApiKeyStep} // Preferir el del contexto
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
