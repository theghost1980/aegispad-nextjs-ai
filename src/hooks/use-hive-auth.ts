"use client";

import { HIVE_USERNAME_LOCAL_STORAGE_KEY } from "@/constants/constants";
import { KeychainHelper, KeychainHelperUtils } from "keychain-helper";
import { useCallback, useEffect, useState } from "react";

export interface KeychainLoginResponseData {
  type: string;
  username: string;
  message: string; // El challenge original
  method: string;
  rpc?: string; // El título que pasamos
  key: string;
}

export interface KeychainLoginResponse {
  success: boolean;
  error: string | null; // Puede ser null o un string de error
  result: string | null; // La firma o null en caso de error
  data: KeychainLoginResponseData | null; // Puede ser null en caso de error
  message: string; // Mensaje de éxito o error
  request_id: number;
  publicKey?: string; // Opcional, a veces se incluye
}

export function useHiveAuth() {
  const [isKeychainAvailable, setIsKeychainAvailable] = useState(false);
  const [isLoadingKeychain, setIsLoadingKeychain] = useState(true);
  const [storedUsername, setStoredUsername] = useState<string | null>(null);

  useEffect(() => {
    KeychainHelperUtils.isKeychainInstalled(window, (isInstalled) => {
      setIsKeychainAvailable(isInstalled);
      setIsLoadingKeychain(false);
    });
    try {
      const username = localStorage.getItem(HIVE_USERNAME_LOCAL_STORAGE_KEY);
      if (username) {
        setStoredUsername(username);
      }
    } catch (error) {
      console.error("Error reading username from localStorage:", error);
    }
  }, []);

  const login = useCallback(
    async (
      usernameToLogin: string
    ): Promise<{ username: string } | { error: string; message?: string }> => {
      if (!isKeychainAvailable) {
        return {
          error: "keychainNotAvailable",
          message: "Hive Keychain is not installed or available.",
        };
      }
      if (!usernameToLogin || usernameToLogin.trim() === "") {
        return {
          error: "usernameRequired",
          message: "Hive username is required for login.",
        };
      }

      return new Promise((resolve) => {
        const challenge = `AegisPadLoginChallenge_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 15)}`;

        KeychainHelper.requestLogin(
          usernameToLogin,
          challenge,
          (response: KeychainLoginResponse) => {
            if (
              response.success &&
              response.data &&
              response.data.username &&
              response.data.username.toLowerCase() ===
                usernameToLogin.toLowerCase()
            ) {
              localStorage.setItem(
                HIVE_USERNAME_LOCAL_STORAGE_KEY,
                usernameToLogin
              );
              const confirmedUsername = response.data.username;
              localStorage.setItem(
                HIVE_USERNAME_LOCAL_STORAGE_KEY,
                confirmedUsername
              );
              setStoredUsername(confirmedUsername);
              resolve({ username: confirmedUsername });
            } else {
              resolve({
                error: response.error || "loginFailed",
                message:
                  response.message ||
                  "Login failed, user cancelled, or username mismatch.",
              });
            }
          },
          "AegisPad Login"
        );
      });
    },
    [isKeychainAvailable]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(HIVE_USERNAME_LOCAL_STORAGE_KEY);
    setStoredUsername(null);
  }, []);

  const isLoggedIn = useCallback((): boolean => {
    return !!storedUsername;
  }, [storedUsername]);

  return {
    isKeychainAvailable,
    isLoadingKeychain,
    login,
    logout,
    isLoggedIn,
    storedUsername,
  };
}
