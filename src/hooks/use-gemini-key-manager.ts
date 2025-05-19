"use client";

import { useHiveAuth } from "@/hooks/use-hive-auth";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authToken } = useHiveAuth();

  useEffect(() => {
    KeychainHelperUtils.isKeychainInstalled(window, (isInstalled) => {
      setIsKeychainAvailable(isInstalled);
      setIsLoadingKeychain(false);
    });
  }, []);

  const testApiKey = useCallback(
    async (apiKey: string): Promise<{ isValid: boolean; error?: string }> => {
      if (!apiKey || apiKey.trim() === "") {
        return { isValid: false, error: "API key cannot be empty." };
      }
      try {
        const response = await fetch("/api/ai/validate-gemini-key", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ apiKey }),
        });

        const result = await response.json();

        if (response.ok && result.isValid) {
          return { isValid: true };
        } else {
          return {
            isValid: false,
            error: result.error || "Invalid API Key or validation failed.",
          };
        }
      } catch (error: any) {
        console.error("Error calling API to test Gemini key:", error);
        return {
          isValid: false,
          error: "Failed to communicate with the server to test API key.",
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
          "aegispad",
          formattedDataToEncode,
          "Memo",
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
          "Memo",
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

  const saveApiKeyToBackend = useCallback(
    async (
      apiKeyToSave: string,
      username: string,
      encodedTested?: boolean
    ): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      let apiKey;
      try {
        if (encodedTested) {
          apiKey = apiKeyToSave;
        } else {
          const testResult = await testApiKey(apiKeyToSave);
          if (!testResult.isValid) {
            throw new Error(testResult.error || "API Key is invalid.");
          }
          const encryptedKey = await encodeData(username, apiKeyToSave);
          apiKey = encryptedKey;
        }

        if (!authToken) {
          throw new Error("User not authenticated. Cannot save API key.");
        }

        const response = await fetch("/api/user/gemini-key", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ encryptedGeminiApiKey: apiKey }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to save API key to backend."
          );
        }
        setIsLoading(false);
        return true;
      } catch (e: any) {
        setError(
          e.message || "An unexpected error occurred while saving API key."
        );
        setIsLoading(false);
        return false;
      }
    },
    [testApiKey, encodeData, authToken]
  );

  const checkIfApiKeyIsConfigured = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      if (!authToken) {
        setIsLoading(false);
        return false;
      }

      const response = await fetch("/api/user/gemini-key", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to check API key status.");
      }
      const { encryptedApiKey } = await response.json();
      setIsLoading(false);
      return !!encryptedApiKey;
    } catch (e: any) {
      setError(
        e.message ||
          "An unexpected error occurred while checking API key status."
      );
      setIsLoading(false);
      return false;
    }
  }, [authToken]);

  const getEncryptedApiKeyFromBackend = useCallback(async (): Promise<
    string | null
  > => {
    setIsLoading(true);
    setError(null);
    try {
      if (!authToken) {
        setIsLoading(false);
        return null;
      }

      const response = await fetch("/api/user/gemini-key", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch encrypted API key."
        );
      }
      const { encryptedApiKey } = await response.json();
      setIsLoading(false);
      return encryptedApiKey;
    } catch (e: any) {
      setError(
        e.message ||
          "An unexpected error occurred while fetching the encrypted API key."
      );
      setIsLoading(false);
      return null;
    }
  }, [authToken]);

  const clearApiKeyFromBackend = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      if (!authToken) {
        throw new Error("User not authenticated. Cannot clear API key.");
      }
      const response = await fetch("/api/user/gemini-key", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete API key.");
      }
      setIsLoading(false);
      return true;
    } catch (e: any) {
      setError(
        e.message || "An unexpected error occurred while deleting API key."
      );
      setIsLoading(false);
      return false;
    }
  }, [authToken]);

  return {
    isKeychainAvailable,
    encodeData,
    decodeData,
    isLoadingKeychain,
    isLoading,
    error,
    setError,
    testApiKey,
    saveApiKeyToBackend,
    checkIfApiKeyIsConfigured,
    clearApiKeyFromBackend,
    getEncryptedApiKeyFromBackend,
  };
}
