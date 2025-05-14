"use client";

import { KeychainHelper, KeychainHelperUtils } from "keychain-helper";
import { useCallback, useEffect, useState } from "react";
import { KEYCHAIN_ENCRYPTION_TEST_MESSAGE } from "../constants/constants";

// declare global {
//   interface Window {
//     hive_keychain?: {
//       requestEncodeMessage: (
//         username: string,
//         receiver: string,
//         message: string,
//         key: 'Posting' | 'Active' | 'Memo',
//         callback: (response: KeychainResponse<string>) => void
//       ) => void;
//       // Añade otras funciones de keychain que necesites aquí
//     };
//   }
// }

interface KeychainResponse<T = any> {
  success: boolean;
  error?: string;
  result?: T;
  message?: string; // A veces el mensaje de error está aquí
  data?: {
    // La estructura de data puede variar
    message?: string; // El mensaje encriptado podría estar aquí
  };
}

export function useGeminiKeyManager() {
  const [isKeychainAvailable, setIsKeychainAvailable] = useState(false);

  useEffect(() => {
    KeychainHelperUtils.isKeychainInstalled(window, (isInstalled) => {
      if (isInstalled) {
        setIsKeychainAvailable(true);
        console.log("Hive Keychain detectado (después del delay).");
      } else {
        setIsKeychainAvailable(false);
        console.log("Hive Keychain no detectado (después del delay).");
      }
    });
  }, []);

  const testEncodeMessage = useCallback(
    async (username: string, onEncoded?: (encodedMessage: string) => void) => {
      if (!isKeychainAvailable) {
        console.error("Hive Keychain no está disponible para la codificación.");
        return;
      }
      console.log(
        `Solicitando codificación para el usuario: ${username} con el mensaje: ${KEYCHAIN_ENCRYPTION_TEST_MESSAGE}`
      );
      KeychainHelper.requestEncodeMessage(
        username,
        username,
        KEYCHAIN_ENCRYPTION_TEST_MESSAGE,
        "Posting",
        (response) => {
          console.log("Respuesta de requestEncodeMessage:", response);
          if (response.success && response.result && onEncoded) {
            onEncoded(response.result);
          }
        }
      );
    },
    [isKeychainAvailable]
  );

  const testDecodeMessage = useCallback(
    async (username: string, encodedMessage: string) => {
      if (!isKeychainAvailable) {
        console.error(
          "Hive Keychain no está disponible para la decodificación."
        );
        return;
      }
      if (!encodedMessage.trim()) {
        console.error("El mensaje codificado no puede estar vacío.");
        return;
      }
      console.log(
        `Solicitando decodificación para el usuario: ${username} con el mensaje codificado: ${encodedMessage}`
      );

      // Usar KeychainHelper.requestVerifyKey con los argumentos correctos
      KeychainHelper.requestVerifyKey(
        username,
        encodedMessage,
        "Posting",
        (response: any) => {
          // El ejemplo usa 'any', podemos refinar esto si conocemos la estructura exacta
          console.log("Respuesta de requestVerifyKey (decode):", response);
          if (response.success && response.value) {
            console.log(
              "requestVerifyKey: Mensaje decodificado y verificado con éxito."
            );
            console.log("Mensaje supuestamente decodificado:", response.result);
          } else {
            console.warn(
              "requestVerifyKey falló o el mensaje no se decodificó:",
              response.message || response.error
            );
          }
        }
      );
    },
    [isKeychainAvailable]
  );

  return { isKeychainAvailable, testEncodeMessage, testDecodeMessage };
}
