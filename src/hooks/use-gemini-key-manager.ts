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
        const verification = /^#\s+$/.test(formattedDataToEncode);
        console.log({ verification }); //TODO REM
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

  return { isKeychainAvailable, encodeData, decodeData, isLoadingKeychain };
}
