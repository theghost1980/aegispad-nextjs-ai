import { Memo } from "@hiveio/dhive";

const AEGISPAD_PRIVATE_MEMO_KEY = process.env.MEMO_KEY;

if (!AEGISPAD_PRIVATE_MEMO_KEY) {
  console.error(
    "FATAL ERROR: AEGISPAD_PRIVATE_MEMO_KEY is not defined in environment variables."
  );
  throw new Error("AEGISPAD_PRIVATE_MEMO_KEY is not defined.");
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
    const decoded = Memo.decode(AEGISPAD_PRIVATE_MEMO_KEY, encryptedMessage);
    return decoded.startsWith("#") ? decoded.substring(1) : decoded;
  } catch (error) {
    console.error("Failed to decode message:", error);
    return null;
  }
}
