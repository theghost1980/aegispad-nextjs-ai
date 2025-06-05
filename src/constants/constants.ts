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
  { value: "Bengali", label: "Bengali" },
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
export const MAX_WORDS_PER_CHUNK = 330;
//voice control feature
export const CMD_CREATE_ARTICLE = "CMD_CREATE_ARTICLE";
export const CMD_HEADING_1 = "CMD_HEADING_1";
export const CMD_HEADING_2 = "CMD_HEADING_2";
export const CMD_HEADING_3 = "CMD_HEADING_3";
export const CMD_NEW_LINE = "CMD_NEW_LINE";
export const CMD_PERIOD = "CMD_PERIOD";
export const CMD_WRITE_DOWN = "CMD_WRITE_DOWN";
export const CMD_SHOW_VOICE_HELP = "CMD_SHOW_VOICE_HELP";
export interface VoiceCommand {
  action: string;
  keywords: string[]; // Palabras clave que activan esta acción
}
export const VOICE_COMMANDS: VoiceCommand[] = [
  {
    action: CMD_CREATE_ARTICLE,
    keywords: ["create", "crear", "create article", "crear artículo"],
  },
  {
    action: CMD_HEADING_1,
    keywords: [
      "h1",
      "heading 1",
      "encabezado 1",
      "título 1",
      "encabezado principal",
      "título principal",
    ],
  },
  {
    action: CMD_HEADING_2,
    keywords: ["h2", "heading 2", "encabezado 2", "título 2"],
  },
  {
    action: CMD_HEADING_3,
    keywords: ["h3", "heading 3", "encabezado 3", "título 3", "subtítulo"],
  },
  {
    action: CMD_NEW_LINE,
    keywords: ["new line", "nueva línea", "enter", "intro"],
  },
  {
    action: CMD_PERIOD,
    keywords: ["period", "punto", "punto final"],
  },
  {
    action: CMD_WRITE_DOWN,
    keywords: ["write down", "escribir", "dictar", "escribe", "dicta"],
  },
  {
    action: CMD_SHOW_VOICE_HELP,
    keywords: [
      "show help",
      "voice help",
      "voice commands",
      "muestra ayuda",
      "mostrar ayuda",
      "ayuda de voz",
      "comandos de voz",
    ],
  },
  // ... puedes añadir más comandos aquí
];

export interface PunctuationRule {
  key: string; // Stable identifier, e.g., "comma", "question_mark"
  char_sign: string; // The actual punctuation character, e.g., ",", "?"
  word_detection: string; // The spoken word(s) to detect, e.g., "comma", "question mark"
}

export const VOICE_PUNCTUATION_MAP: Record<string, PunctuationRule[]> = {
  en: [
    { key: "comma", char_sign: ",", word_detection: "comma" },
    { key: "period", char_sign: ".", word_detection: "period" },
    { key: "full_stop", char_sign: ".", word_detection: "full stop" },
    { key: "question_mark", char_sign: "?", word_detection: "question mark" },
    {
      key: "ellipsis",
      char_sign: "...",
      word_detection: "ellipsis",
    },
    {
      key: "open_question_mark",
      char_sign: "?",
      word_detection: "open question",
    },
    {
      key: "close_question_mark",
      char_sign: "?",
      word_detection: "open question",
    },
    {
      key: "open_exclamation_mark",
      char_sign: "¡",
      word_detection: "open exclamation mark",
    },
    {
      key: "close_exclamation_mark",
      char_sign: "!",
      word_detection: "close exclamation mark",
    },
    { key: "quote", char_sign: '"', word_detection: "quotes" },
    { key: "open_quote", char_sign: '"', word_detection: "open quotes" },
    { key: "close_quote", char_sign: '"', word_detection: "close quotes" },
    { key: "apostrophe", char_sign: "'", word_detection: "apostrophe" },
    { key: "dash", char_sign: "-", word_detection: "dash" },
    { key: "low_dash", char_sign: "_", word_detection: "low dash" },
    { key: "colon", char_sign: ":", word_detection: "colon" },
    { key: "semicolon", char_sign: ";", word_detection: "semicolon" },
    { key: "newline", char_sign: "\n", word_detection: "newline" },
    {
      key: "new_paragraph",
      char_sign: "\n\n",
      word_detection: "new paragraph",
    },
    { key: "asterisk", char_sign: "*", word_detection: "asterisk" },
    { key: "hashtag", char_sign: "#", word_detection: "hashtag" },
    { key: "equals", char_sign: "=", word_detection: "equals" },
    { key: "plus", char_sign: "+", word_detection: "plus" },
    { key: "minus", char_sign: "-", word_detection: "minus" },
    { key: "tilde", char_sign: "~", word_detection: "tilde" },
    { key: "bar", char_sign: "/", word_detection: "slash" },
    { key: "backtick", char_sign: "`", word_detection: "backtick" },
    {
      key: "backslash",
      char_sign: "\\",
      word_detection: "back slash",
    },

    {
      key: "open_parenthesis",
      char_sign: "(",
      word_detection: "open parenthesis",
    },
    {
      key: "close_parenthesis",
      char_sign: ")",
      word_detection: "close parenthesis",
    },
    { key: "open_bracket", char_sign: "[", word_detection: "open bracket" },
    { key: "close_bracket", char_sign: "]", word_detection: "close bracket" },
    { key: "open_brace", char_sign: "{", word_detection: "open brace" },
    { key: "close_brace", char_sign: "}", word_detection: "close brace" },
    { key: "at_symbol", char_sign: "@", word_detection: "at symbol" },
    { key: "ampersand", char_sign: "&", word_detection: "ampersand" },
    { key: "dollar_sign", char_sign: "$", word_detection: "dollar sign" },
    { key: "percent_sign", char_sign: "%", word_detection: "percent sign" },
    { key: "caret", char_sign: "^", word_detection: "caret" },
    { key: "pipe", char_sign: "|", word_detection: "pipe" },
    { key: "less_than", char_sign: "<", word_detection: "less than" },
    { key: "greater_than", char_sign: ">", word_detection: "greater than" },
  ],
  es: [
    { key: "comma", char_sign: ",", word_detection: "coma" },
    { key: "period", char_sign: ".", word_detection: "punto" },
    { key: "full_stop", char_sign: ".", word_detection: "punto final" },
    { key: "question_mark", char_sign: "?", word_detection: "cierra pregunta" },
    {
      key: "ellipsis",
      char_sign: "...",
      word_detection: "punto suspensivos",
    },
    {
      key: "open_question_mark",
      char_sign: "¿",
      word_detection: "signo de interrogación",
    },
    {
      key: "close_question_mark",
      char_sign: "?",
      word_detection: "cierre interrogación",
    },
    {
      key: "open_exclamation_mark",
      char_sign: "¡",
      word_detection: "signo de exclamación",
    },
    {
      key: "close_exclamation_mark",
      char_sign: "!",
      word_detection: "cierre exclamación",
    },
    { key: "quote", char_sign: '"', word_detection: "comillas" },
    { key: "open_quote", char_sign: '"', word_detection: "abrir comillas" },
    {
      key: "close_quote",
      char_sign: '"',
      word_detection: "cerrar comillas",
    },
    { key: "apostrophe", char_sign: "'", word_detection: "apóstrofo" },
    { key: "dash", char_sign: "-", word_detection: "guion" },
    { key: "low_dash", char_sign: "_", word_detection: "guion bajo" },
    { key: "colon", char_sign: ":", word_detection: "coma" },
    { key: "semicolon", char_sign: ";", word_detection: "punto y coma" },
    { key: "newline", char_sign: "\n", word_detection: "nueva línea" },
    {
      key: "new_paragraph",
      char_sign: "\n\n",
      word_detection: "nuevo parrafo",
    },
    { key: "asterisk", char_sign: "*", word_detection: "asterisco" },
    { key: "hashtag", char_sign: "#", word_detection: "almohadilla" },
    { key: "equals", char_sign: "=", word_detection: "signo igual" },
    { key: "plus", char_sign: "+", word_detection: "signo suma" },
    { key: "minus", char_sign: "-", word_detection: "signo resta" },
    { key: "tilde", char_sign: "~", word_detection: "tilde" },
    { key: "bar", char_sign: "/", word_detection: "simbolo de barra" },
    { key: "backtick", char_sign: "`", word_detection: "comilla invertida" },
    {
      key: "backslash",
      char_sign: "\\",
      word_detection: "barra invertida",
    },
    {
      key: "open_parenthesis",
      char_sign: "(",
      word_detection: "paréntesis abierto",
    },
    {
      key: "close_parenthesis",
      char_sign: ")",
      word_detection: "paréntesis cerrado",
    },
    {
      key: "open_bracket",
      char_sign: "[",
      word_detection: "corchete abierto",
    },
    {
      key: "close_bracket",
      char_sign: "]",
      word_detection: "corchete cerrado",
    },
    { key: "open_brace", char_sign: "{", word_detection: "llave abierta" },
    { key: "close_brace", char_sign: "}", word_detection: "llave cerrada" },
    { key: "at_symbol", char_sign: "@", word_detection: "arroba" },
    { key: "ampersand", char_sign: "&", word_detection: "ampersand" },
    { key: "dollar_sign", char_sign: "$", word_detection: "signo de dólar" },
    {
      key: "percent_sign",
      char_sign: "%",
      word_detection: "signo de porcentaje",
    },
    {
      key: "caret",
      char_sign: "^",
      word_detection: "acento circunflejo",
    },
    { key: "pipe", char_sign: "|", word_detection: "barra vertical" },
    { key: "less_than", char_sign: "<", word_detection: "menor que" },
    { key: "greater_than", char_sign: ">", word_detection: "mayor que" },
  ],
  // Add other languages as needed
};
