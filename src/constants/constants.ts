import { FaqItem } from "@/app/[locale]/faq/page";

export const GEMINI_API_KEY_LOCAL_STORAGE_KEY =
  "aegispad_gemini_api_key_encrypted";
export const KEYCHAIN_ENCRYPTION_TEST_MESSAGE =
  "#AegisPad_Test_Encryption_Message_v1";
export const HIVE_KEYCHAIN_INSTALL_URL =
  "https://chromewebstore.google.com/detail/hive-keychain/jcacnejopjdphbnjgfaaobbfafkihpep";
export const HIVE_KEYCHAIN_WEBSITE_URL = "https://hive-keychain.com/";
export const COMMENT_NOTES_BY_LOCALE: { [key: string]: string } = {
  en: "Translation as comment.",
  es: "Traducción como comentario.",
  fr: "Traduction en commentaire.",
  de: "Übersetzung als Kommentar.",
  pt: "Tradução como comentário.",
  it: "Traduzione come commento.",
  ja: "コメントとしての翻訳。",
  ko: "댓글로 번역.",
  ru: "Перевод в виде комментария.",
  zh: "作为评论的翻译。",
  ar: "ترجمة كتعليق.",
  hi: "टिप्पणी के रूप में अनुवाद।",
  nl: "Vertaling als commentaar.",
  sv: "Översättning som kommentar.",
  pl: "Tłumaczenie jako komentarz.",
  tr: "Yorum olarak çeviri.",
  // Agrega más idiomas según sea necesario
};
export const LANGUAGE_TO_LOCALE_MAP: { [key: string]: string } = {
  spanish: "es",
  english: "en",
  french: "fr",
  german: "de",
  "portuguese (brazil)": "pt",
  portuguese: "pt",
  italian: "it",
  japanese: "ja",
  korean: "ko",
  russian: "ru",
  "chinese (simplified)": "zh",
  chinese: "zh",
  arabic: "ar",
  hindi: "hi",
  dutch: "nl",
  swedish: "sv",
  polish: "pl",
  turkish: "tr",
  // Incluir códigos de locale directamente para pasarlos si ya están en ese formato
  es: "es",
  en: "en",
  // ... (puedes completar el resto de códigos de locale si lo ves necesario, aunque la lógica principal es para los nombres completos)
};
export const HIVE_USERNAME_LOCAL_STORAGE_KEY = "aegispad_hive_username";
export const GEMINI_API_KEY_INFO_URL = "https://aistudio.google.com/app/apikey";
export const GEMINI_AI_MODEL_NAME = "gemini-1.5-flash-latest";
export const AVAILABLE_LANGUAGES = [
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Japanese", label: "Japanese" },
  { value: "Chinese (Simplified)", label: "Chinese (Simplified)" },
  { value: "Russian", label: "Russian" },
  { value: "Portuguese (Brazil)", label: "Portuguese (Brazil)" },
  { value: "Italian", label: "Italian" },
  { value: "Korean", label: "Korean" },
  { value: "Arabic", label: "Arabic" },
  { value: "English", label: "English" },
];

export const ESTIMATED_INITIAL_SESSION_TOKENS = 100000;
export const DEFAULT_TARGET_LANGUAGE = AVAILABLE_LANGUAGES[0].value;
export const DEFAULT_SOURCE_LANGUAGE_CREATION = "English";
export const FINAL_REVIEW_ARTICLE_STORAGE_KEY = "hivePad_finalReviewArticle";

export const faqData: FaqItem[] = [
  {
    id: "q1",
    questionKey: "sampleQ1Title",
    answerKey: "sampleQ1Content",
  },
  {
    id: "q2",
    questionKey: "sampleQ2Title",
    answerKey: "sampleQ2Content",
  },
  {
    id: "q3",
    questionKey: "sampleQ3Title",
    answerKey: "sampleQ3Content",
  },
  {
    id: "q4",
    questionKey: "geminiApiUsageQuestion",
    answerKey: "geminiApiUsageAnswer",
  },
  {
    id: "q5",
    questionKey: "supportedLanguagesQuestion",
    answerKey: "supportedLanguagesAnswer",
  },
  {
    id: "q6",
    questionKey: "articleRevisionProcessQuestion",
    answerKey: "articleRevisionProcessAnswer",
  },
  {
    id: "q7",
    questionKey: "workSavingQuestion",
    answerKey: "workSavingAnswer",
  },
  {
    id: "q8",
    questionKey: "hivePublishingQuestion",
    answerKey: "hivePublishingAnswer",
  },
  {
    id: "q9",
    questionKey: "betaFeedbackQuestion",
    answerKey: "betaFeedbackAnswer",
  },
  {
    id: "q10",
    questionKey: "betaVersionMeaningQuestion",
    answerKey: "betaVersionMeaningAnswer",
  },
  {
    id: "q11",
    questionKey: "dataPrivacyQuestion",
    answerKey: "dataPrivacyAnswer",
  },
];
