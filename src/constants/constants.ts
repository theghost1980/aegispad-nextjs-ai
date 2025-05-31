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
  es: "es",
  en: "en",
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
    questionKey: "whatIsAegisPadQuestion",
    answerKey: "whatIsAegisPadAnswer",
  },
  {
    id: "q2",
    questionKey: "aiAssistanceQuestion",
    answerKey: "aiAssistanceAnswer",
  },
  {
    id: "q3",
    questionKey: "hiveAccountRequirementQuestion",
    answerKey: "hiveAccountRequirementAnswer",
  },
  {
    id: "q4",
    questionKey: "beneficiaryModelQuestion",
    answerKey: "beneficiaryModelAnswer",
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
  {
    id: "q12",
    questionKey: "customizationQuestion",
    answerKey: "customizationAnswer",
  },
  {
    id: "q13",
    questionKey: "blogVsCommunityPostQuestion",
    answerKey: "blogVsCommunityPostAnswer",
  },
  {
    id: "faq-devlogs",
    questionKey: "devlogsQuestion",
    answerKey: "devlogsAnswerWithLink",
  },
];

export const JWT_ACCESS_TOKEN_EXPIRES_IN = "15m";
export const JWT_REFRESH_TOKEN_EXPIRES_IN = "7d";
export const AEGISPAD_DEFAULT_TAG = "aegispad";
export const AEGISPAD_ACCOUNT_NAME = "aegispad";
export const AEGISPAD_ACCOUNT_BENEFITS_PERCENTAGE = 600; //6%, sería 500
export const MAX_HIVE_TAGS = 10;
export const MIN_HIVE_TAG_LENGTH = 3;
export const MAX_HIVE_TAG_LENGTH = 24;
export const APP_NAME = "aegispad";
export const APP_VERSION = "1.0.0";

export const HIVE_CLIENT_NODES = [
  "https://api.hive.blog",
  "https://api.deathwing.me",
  "https://rpc.ausbit.dev",
  "https://api.openhive.network",
];

export const HIVELENS_API_ENDPOINT_PROD =
  "https://hivelens.duckdns.org/api/search";
export const HIVELENS_API_ENDPOINT_DEV = "http://localhost:9009/api/search";
export const WAVESPEED_API_URL =
  "https://api.wavespeed.ai/api/v3/wavespeed-ai/hidream-i1-dev";
export const WAVESPEED_RESULT_API_URL_BASE =
  "https://api.wavespeed.ai/api/v3/predictions/";
