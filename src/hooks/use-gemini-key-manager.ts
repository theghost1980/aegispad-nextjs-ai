"use client";

import { GEMINI_API_KEY_LOCAL_STORAGE_KEY } from "@/constants/constants";
import { validateGeminiApiKeyWithAPI } from "@/utils/gemini-api"; // Importar la utilidad
import { KeychainHelper, KeychainHelperUtils } from "keychain-helper";
import { useCallback, useEffect, useState } from "react";

export interface KeychainResponse<T = any> {
  success: boolean;
  error?: string;
  result?: T;
  message?: string;
  data?: {
    message?: string;
  };
}

export function useGeminiKeyManager() {
  const [isKeychainAvailable, setIsKeychainAvailable] = useState(false);
  const [isLoadingKeychain, setIsLoadingKeychain] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      KeychainHelperUtils.isKeychainInstalled(window, (isInstalled) => {
        setIsKeychainAvailable(isInstalled);
        setIsLoadingKeychain(false);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const testApiKey = useCallback(
    async (apiKey: string): Promise<{ isValid: boolean; error?: string }> => {
      if (!apiKey || apiKey.trim() === "") {
        return { isValid: false, error: "API key cannot be empty." };
      }
      try {
        const isValid = await validateGeminiApiKeyWithAPI(apiKey);
        if (isValid) {
          return { isValid: true };
        } else {
          return { isValid: false, error: "Invalid API Key." };
        }
      } catch (error: any) {
        return {
          isValid: false,
          error: error.message || "Failed to test API key.",
        };
      }
    },
    []
  );

  const encodeData = useCallback(
    (username: string, dataToEncode: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!isKeychainAvailable) {
          reject(new Error("keychainNotAvailableEncode"));
          return;
        }
        if (!username || !dataToEncode) {
          reject(new Error("inputsRequiredEncode"));
          return;
        }

        const formattedDataToEncode = dataToEncode.startsWith("#")
          ? dataToEncode
          : `#${dataToEncode}`;

        if (/^#\s+$/.test(formattedDataToEncode)) {
          reject(new Error("errorInvalidEncodedFormat"));
          return;
        }

        KeychainHelper.requestEncodeMessage(
          username,
          username,
          formattedDataToEncode,
          "Posting",
          (response: KeychainResponse) => {
            if (response.success && response.result) {
              if (
                response.result !== formattedDataToEncode &&
                response.result.startsWith("#")
              ) {
                resolve(response.result);
              } else {
                reject(new Error("encodeProcessFailed"));
              }
            } else {
              const errorMessageKey =
                response.error === "incomplete"
                  ? "errorInvalidEncodedFormat"
                  : (response.error as string) || "encodeGenericError";
              reject(new Error(errorMessageKey));
            }
          }
        );
      });
    },
    [isKeychainAvailable]
  );

  const decodeData = useCallback(
    (username: string, encodedData: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!isKeychainAvailable) {
          reject(new Error("keychainNotAvailableDecode"));
          return;
        }
        if (!username || !encodedData || !encodedData.trim()) {
          reject(new Error("inputsRequiredDecode"));
          return;
        }

        KeychainHelper.requestVerifyKey(
          username,
          encodedData,
          "Posting",
          (response: KeychainResponse) => {
            if (response.success && response.result) {
              if (
                response.result !== encodedData &&
                response.result.startsWith("#")
              ) {
                resolve(response.result);
              } else {
                new Error("decodeProcessFailed");
              }
            } else {
              reject(
                new Error((response.error as string) || "decodeGenericError")
              );
            }
          }
        );
      });
    },
    [isKeychainAvailable]
  );

  const storeEncryptedApiKey = useCallback((encryptedApiKey: string) => {
    try {
      localStorage.setItem(GEMINI_API_KEY_LOCAL_STORAGE_KEY, encryptedApiKey);
    } catch (error) {
      console.error("Error storing encrypted API key:", error);
      //TODO Podrías manejar este error, quizás con un toast
    }
  }, []);

  const getStoredEncryptedApiKey = useCallback((): string | null => {
    try {
      return localStorage.getItem(GEMINI_API_KEY_LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error("Error retrieving encrypted API key:", error);
      return null;
    }
  }, []);

  const clearStoredApiKey = useCallback(() => {
    try {
      localStorage.removeItem(GEMINI_API_KEY_LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing stored API key:", error);
    }
  }, []);

  const hasStoredApiKey = useCallback((): boolean => {
    return !!getStoredEncryptedApiKey();
  }, [getStoredEncryptedApiKey]);

  return {
    isKeychainAvailable,
    encodeData,
    decodeData,
    isLoadingKeychain,
    testApiKey,
    storeEncryptedApiKey,
    getStoredEncryptedApiKey,
    clearStoredApiKey,
    hasStoredApiKey,
  };
}
