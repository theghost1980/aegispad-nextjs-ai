import { LANGUAGE_TO_LOCALE_MAP } from "@/constants/constants";

export const getLocaleFromLanguageValue = (
  langValue?: string | null
): string => {
  if (!langValue) return "en"; // Fallback si no hay valor
  const lowerLangValue = langValue.toLowerCase().trim();
  return LANGUAGE_TO_LOCALE_MAP[lowerLangValue] || "en"; // Fallback a "en" si no hay match
};
