import { Memo } from "@hiveio/dhive";

const AEGISPAD_PRIVATE_MEMO_KEY = process.env.MEMO_KEY;

if (!AEGISPAD_PRIVATE_MEMO_KEY) {
  console.error(
    "FATAL ERROR: AEGISPAD_PRIVATE_MEMO_KEY is not defined in environment variables."
  );
  // En un entorno de producción, podrías querer que la aplicación falle al iniciar
  // si esta clave crítica no está presente.
  // throw new Error("AEGISPAD_PRIVATE_MEMO_KEY is not defined.");
}

/**
 * Decodes an encrypted message (expected to be a Gemini API key prefixed with '#')
 * using AegisPad's private memo key.
 *
 * @param encryptedMessage The message string (e.g., "#P...") to decode.
 * @returns The decoded message without the leading '#' or null if decoding fails or key is missing.
 */
export function decodeEncryptedApiKey(encryptedMessage: string): string | null {
  if (!AEGISPAD_PRIVATE_MEMO_KEY) {
    console.error("Cannot decode: AegisPad's private memo key is not set.");
    return null;
  }
  try {
    console.log("Decoding message:", encryptedMessage); //TODO REM
    const decoded = Memo.decode(AEGISPAD_PRIVATE_MEMO_KEY, encryptedMessage);
    console.log("Decoded message:", decoded); //TODO REM
    return decoded.startsWith("#") ? decoded.substring(1) : decoded;
  } catch (error) {
    console.error("Failed to decode message:", error);
    return null;
  }
}
