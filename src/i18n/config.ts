import type { NestedKeyOf } from "next-intl";

type LanguageSwitcherTranslationKeys = NestedKeyOf<
  IntlMessages["LanguageSwitcher"]
>;

export const localeDetails = [
  { code: "en-US", nameKey: "english" as LanguageSwitcherTranslationKeys },
  { code: "es-ES", nameKey: "spanish" as LanguageSwitcherTranslationKeys },
  { code: "fr-FR", nameKey: "french" as LanguageSwitcherTranslationKeys },
  {
    code: "pt-BR",
    nameKey: "portugueseBrazil" as LanguageSwitcherTranslationKeys,
  },
] as const;

export const allLocales = localeDetails.map((ld) => ld.code);
export type AppLocale = (typeof allLocales)[number];

export const defaultLocale: AppLocale = "en-US";
