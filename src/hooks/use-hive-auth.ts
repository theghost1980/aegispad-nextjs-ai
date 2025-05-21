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
  message: string;
  method: string;
  rpc?: string;
  key: string;
}

export interface KeychainLoginResponse {
  success: boolean;
  error: string | null;
  result: string | null;
  data: KeychainLoginResponseData | null;
  message: string;
  request_id: number;
  publicKey?: string;
}

export function useHiveAuth() {
  const [isKeychainAvailable, setIsKeychainAvailable] = useState(false);
  const [isLoadingKeychain, setIsLoadingKeychain] = useState(true);
  const { hiveUsername, setHiveUsername } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
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
        const storedUserRole = await getItem<string>("currentUserRole");

        if (storedUsernameFromDB && storedAccessToken && storedUserRole) {
          setHiveUsername(storedUsernameFromDB);
          setIsAuthenticated(true);
          setAuthToken(storedAccessToken);
          setUserRole(storedUserRole);
        } else {
          await clearUserSessionData();
          setHiveUsername(null);
          setIsAuthenticated(false);
          setAuthToken(null);
          setUserRole(null);
        }
      } catch (e) {
        console.error("Error loading auth status from IndexedDB", e);
        setHiveUsername(null);
        setIsAuthenticated(false);
        setAuthToken(null);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, [setHiveUsername, hiveUsername]);

  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const [refreshPromise, setRefreshPromise] = useState<Promise<
    string | null
  > | null>(null);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Opcional: Llamar a una API /api/auth/logout para invalidar el refresh token en el backend
      await clearUserSessionData();
      setHiveUsername(null);
      setIsAuthenticated(false);
      setAuthToken(null);
      setUserRole(null);
      if (refreshPromise) {
        setRefreshPromise(null);
      }
    } catch (e: any) {
      setError(e.message || "An error occurred during logout.");
    } finally {
      setIsLoading(false);
      router.push("/");
    }
  }, [
    setHiveUsername,
    router,
    refreshPromise,
    setRefreshPromise,
    setIsLoading,
    setError,
    setIsAuthenticated,
    setAuthToken,
    setUserRole,
  ]);

  // Función para refrescar el token de acceso usando el refresh token
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    // Si ya hay un refresco en progreso, reutilizar la promesa existente
    if (isRefreshingToken && refreshPromise) {
      console.log("Refresh already in progress, waiting for existing promise.");
      return refreshPromise;
    }

    setIsRefreshingToken(true);
    setError(null);

    const promise = (async () => {
      try {
        const storedRefreshToken = await getItem<string>("refreshToken");

        if (!storedRefreshToken) {
          console.error(
            "No refresh token found in storage during refresh attempt."
          );
          await logout();
          return null;
        }

        console.log("Attempting to refresh token...");
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Token refresh failed:", errorData.message);
          await logout(); // Forzar logout y redirigir
          return null;
        }

        const {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          // user: refreshedUser, // Si el endpoint de refresh devolviera el usuario
        } = await response.json();

        if (!newAccessToken || !newRefreshToken) {
          console.error("Refresh endpoint did not return new tokens.");
          await logout(); // Forzar logout y redirigir
          return null;
        }

        console.log(
          "Token refreshed successfully. Updating storage and state."
        );
        await setItem("accessToken", newAccessToken);
        await setItem("refreshToken", newRefreshToken);
        setAuthToken(newAccessToken);
        // Si el endpoint /api/auth/refresh devolviera el objeto user con el rol:
        // if (refreshedUser && refreshedUser.role) {
        //   await setItem("currentUserRole", refreshedUser.role);
        //   setUserRole(refreshedUser.role);
        // }

        return newAccessToken;
      } catch (e: any) {
        console.error("An unexpected error occurred during token refresh:", e);
        setError(e.message || "Failed to refresh authentication token.");
        await logout();
        return null;
      } finally {
        setIsRefreshingToken(false);
        setRefreshPromise(null);
      }
    })();

    setRefreshPromise(promise); // Almacenar la promesa para evitar duplicados
    return promise; // Devolver la promesa inmediatamente
  }, [
    isRefreshingToken,
    refreshPromise,
    setAuthToken,
    logout,
    setIsRefreshingToken,
    setError,
    setRefreshPromise,
    // getItem y setItem son importaciones estables, no necesitan ser dependencias
  ]);

  // Función wrapper para fetch que maneja el refresco de token
  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      let currentToken = authToken;

      if (!currentToken) {
        currentToken = await getItem<string>("accessToken");
        if (currentToken) {
          setAuthToken(currentToken);
        }
      }

      if (!currentToken) {
        console.error(
          `authenticatedFetch: No auth token available for ${url}.`
        );
        await logout(); // Forzar logout si se intenta una llamada protegida sin token
        throw new Error("Unauthorized: No authentication token available.");
      }

      const headers = {
        ...options.headers,
        Authorization: `Bearer ${currentToken}`,
      };

      let response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        console.log(`Received 401 for ${url}. Attempting to refresh token.`);
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
          console.log(`Token refreshed. Retrying original request to ${url}.`);
          const retryHeaders = {
            ...options.headers,
            Authorization: `Bearer ${newAccessToken}`,
          };
          response = await fetch(url, { ...options, headers: retryHeaders });

          // Si el reintento falla (cualquier status no-OK), lanzar un error
          if (!response.ok) {
            console.error(
              `Retry request to ${url} failed with status ${response.status}`
            );
            const errorBody = await response
              .text()
              .catch(() => "No response body");
            throw new Error(
              `Request retry failed: ${response.status} ${response.statusText} - ${errorBody}`
            );
          }
        } else {
          console.error(
            `Token refresh failed for ${url}. Original request not retried.`
          );
          throw new Error(
            "Authentication token expired and could not be refreshed."
          );
        }
      }

      // Si la respuesta inicial no fue 401 pero no fue OK, lanzar un error
      if (!response.ok && response.status !== 401) {
        console.error(
          `Request to ${url} failed with status ${response.status}`
        );
        const errorBody = await response.text().catch(() => "No response body");
        throw new Error(
          `Request failed: ${response.status} ${response.statusText} - ${errorBody}`
        );
      }

      return response;
    },
    [authToken, refreshAccessToken, logout, setAuthToken]
  );

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
          !keychainResponse.result ||
          !keychainResponse.data ||
          keychainResponse.data.message !== backendChallenge
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
            challenge: backendChallenge,
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
        await setItem("currentUserRole", user.role);
        await setItem("lastLoginTimestamp", Date.now());

        setAuthToken(accessToken);
        setHiveUsername(user.username);
        setUserRole(user.role);
        setIsAuthenticated(true);
        setIsLoading(false);
        return true;
      } catch (e: any) {
        setError(e.message || "An unexpected error occurred during login.");
        setIsLoading(false);
        return false;
      }
    },
    [
      isKeychainAvailable,
      setHiveUsername,
      setIsLoading,
      setError,
      setAuthToken,
      setIsAuthenticated,
      setUserRole,
    ]
  );

  return {
    isKeychainAvailable,
    isLoadingKeychain,
    login,
    logout,
    authToken,
    hiveUsername,
    userRole, // Exponer el rol del usuario
    isLoading,
    error,
    isAuthenticated,
    setError,
    authenticatedFetch,
  };
}
