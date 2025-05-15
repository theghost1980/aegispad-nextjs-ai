"use client";

import { KeychainHelper, KeychainHelperUtils } from "keychain-helper";
import { useCallback, useEffect, useState } from "react";

interface KeychainResponse<T = any> {
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

  const encodeData = useCallback(
    (username: string, dataToEncode: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!isKeychainAvailable) {
          reject(
            new Error("Hive Keychain no está disponible para la codificación.")
          );
          return;
        }
        if (!username || !dataToEncode) {
          reject(
            new Error(
              "El nombre de usuario y los datos a codificar son requeridos."
            )
          );
          return;
        }

        const formattedDataToEncode = dataToEncode.startsWith("#")
          ? dataToEncode
          : `#${dataToEncode}`;

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
                reject(
                  new Error(
                    "La codificación no alteró los datos o el formato es inesperado."
                  )
                );
              }
            } else {
              reject(
                new Error(
                  response.message ||
                    response.error ||
                    "Error al codificar el mensaje."
                )
              );
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
          reject(
            new Error(
              "Hive Keychain no está disponible para la decodificación."
            )
          );
          return;
        }
        if (!username || !encodedData || !encodedData.trim()) {
          reject(
            new Error(
              "El nombre de usuario y los datos codificados son requeridos y no pueden estar vacíos."
            )
          );
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
                reject(
                  new Error(
                    "La decodificación no produjo el resultado esperado o el formato es incorrecto."
                  )
                );
              }
            } else {
              reject(
                new Error(
                  response.message ||
                    response.error ||
                    "Error al decodificar el mensaje."
                )
              );
            }
          }
        );
      });
    },
    [isKeychainAvailable]
  );

  return { isKeychainAvailable, encodeData, decodeData, isLoadingKeychain };
}
