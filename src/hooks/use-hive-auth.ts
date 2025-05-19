"use client";

import { AppContext } from "@/context/app-context";
import { useRouter } from "@/i18n/routing";
import {
  clearUserSessionData,
  getItem,
  setItem,
} from "@/lib/indexed-db-service";
import { KeychainHelper, KeychainHelperUtils } from "keychain-helper";
import { useCallback, useContext, useEffect, useState } from "react";

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
  const { hiveUsername, setHiveUsername } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    KeychainHelperUtils.isKeychainInstalled(window, (isInstalled) => {
      setIsKeychainAvailable(isInstalled);
      setIsLoadingKeychain(false);
    });
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        const storedUsernameFromDB = await getItem<string>(
          "currentUserHiveUsername"
        );
        const storedAccessToken = await getItem<string>("accessToken");

        if (storedUsernameFromDB && storedAccessToken) {
          setHiveUsername(storedUsernameFromDB);
          setIsAuthenticated(true);
          setAuthToken(storedAccessToken);
        } else {
          await clearUserSessionData();
          setHiveUsername(null);
          setIsAuthenticated(false);
          setAuthToken(null);
        }
      } catch (e) {
        console.error("Error loading auth status from IndexedDB", e);
        setHiveUsername(null);
        setIsAuthenticated(false);
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, [hiveUsername]);

  const login = useCallback(
    async (usernameToLogin: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      if (!isKeychainAvailable) {
        setError("Hive Keychain is not installed or available.");
        setIsLoading(false);
        return false;
      }
      if (!usernameToLogin || usernameToLogin.trim() === "") {
        setError("Hive username is required for login.");
        setIsLoading(false);
        return false;
      }

      try {
        // 1. Get challenge from our backend
        const challengeApiResponse = await fetch("/api/auth/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: usernameToLogin }),
        });

        if (!challengeApiResponse.ok) {
          const errorData = await challengeApiResponse.json();
          throw new Error(
            errorData.message || "Failed to get challenge from server."
          );
        }

        const { challenge: backendChallenge } =
          await challengeApiResponse.json();
        if (!backendChallenge) {
          throw new Error("Challenge not received from server.");
        }

        // 2. Use KeychainHelper.requestLogin to sign the backendChallenge
        const keychainResponse: KeychainLoginResponse = await new Promise(
          (resolveKeychain) => {
            KeychainHelper.requestLogin(
              usernameToLogin,
              backendChallenge, // Usamos el challenge de nuestro backend aquí
              (response: KeychainLoginResponse) => {
                resolveKeychain(response);
              },
              "AegisPad Login Verification" // Título para la ventana de Keychain
            );
          }
        );

        if (
          !keychainResponse.success ||
          !keychainResponse.result || // La firma
          !keychainResponse.data ||
          keychainResponse.data.message !== backendChallenge // Verificar que el challenge firmado es el nuestro
        ) {
          throw new Error(
            keychainResponse.message ||
              "Keychain signing failed, user cancelled, or challenge mismatch."
          );
        }

        const signature = keychainResponse.result;

        // 3. Send username, backendChallenge, and signature to our /api/auth/login
        const loginApiResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: usernameToLogin,
            challenge: backendChallenge, // El challenge que generó nuestro backend y se firmó
            signature,
          }),
        });

        if (!loginApiResponse.ok) {
          const errorData = await loginApiResponse.json();
          throw new Error(errorData.message || "Backend login failed.");
        }

        const {
          accessToken,
          refreshToken: newRefreshToken,
          user,
        } = await loginApiResponse.json();

        if (!accessToken || !newRefreshToken || !user || !user.username) {
          throw new Error(
            "Access token, refresh token, or user info not received."
          );
        }

        // 4. Store tokens and user info
        await setItem("accessToken", accessToken);
        await setItem("refreshToken", newRefreshToken);
        await setItem("currentUserHiveUsername", user.username);
        await setItem("lastLoginTimestamp", Date.now());

        setAuthToken(accessToken);
        setHiveUsername(user.username);
        setIsAuthenticated(true);
        setIsLoading(false);
        return true; // Login exitoso
      } catch (e: any) {
        setError(e.message || "An unexpected error occurred during login.");
        setIsLoading(false);
        return false; // Login fallido
      }
    },
    [isKeychainAvailable, setHiveUsername, isAuthenticated]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Opcional: Llamar a una API /api/auth/logout para invalidar el refresh token en el backend
      await clearUserSessionData();
      setHiveUsername(null);
      setIsAuthenticated(false);
      setAuthToken(null);
    } catch (e: any) {
      setError(e.message || "An error occurred during logout.");
    } finally {
      setIsLoading(false);
      router.push("/");
    }
  }, [setHiveUsername]);

  return {
    isKeychainAvailable,
    isLoadingKeychain,
    login,
    logout,
    authToken,
    hiveUsername,
    isLoading,
    error,
    isAuthenticated,
    setError,
  };
}
