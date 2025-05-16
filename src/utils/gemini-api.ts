/**
 * Valida una API Key de Gemini haciendo una llamada de prueba a la API.
 * ¡IMPORTANTE! Necesitarás implementar la lógica real de la llamada a la API aquí.
 *
 * @param apiKey La API Key de Gemini a validar.
 * @returns true si la clave es válida, false en caso contrario.
 * @throws Error si la llamada a la API falla por otras razones (red, etc.).
 */
export async function validateGeminiApiKeyWithAPI(
  apiKey: string
): Promise<boolean> {
  if (!apiKey || apiKey.trim() === "") {
    console.warn("API key is empty, validation will fail.");
    return false;
  }
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    return response.ok;
  } catch (error) {
    console.error("Error validating Gemini API key:", error);
    throw error;
  }
}
