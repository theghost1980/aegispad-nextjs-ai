export type CombineFormatType =
  | "simple"
  | "detailsTag"
  | "inline"
  | "inComments";

export type InitialWorkflow = "aiCreate" | "userWrite";
export type ActiveEditorAction =
  | null
  | "create"
  | "revise"
  | "translate"
  | "combine"
  | "finalReview";
export type RevisionType = "full" | "selective";

export interface StoredArticleData {
  title: string;
  content: string;
  suggestedTags?: string[];
}

export type UserPreferences = {
  theme_preference?: "light" | "dark" | "system";
  login_redirect_preference?: "/" | "/editor";
};

export interface SubscribedCommunity {
  id: string; // ej. "hive-167922"
  name: string; // ej. "LeoFinance"
  role: string; // ej. "guest"
  pending_posts?: string | number;
}

export interface ImageServiceResponse {
  ok: boolean;
  version: string;
  date: string;
}

export interface VerifiedServiceInfo {
  name: string;
  url: string;
  data: ImageServiceResponse;
}

export interface DeterminedStorageInfo {
  type: "primary" | "fallback";
  name: string;
  url?: string;
}

export type LanguageCode = "en" | "es" | "fr" | "pt-br";

export type AuthenticatedFetch = (
  url: string,
  options?: RequestInit
) => Promise<Response>;

export interface KeychainLoginResponseData {
  type: string;
  username: string;
  message: string;
  method: string;
  rpc?: string;
  key: string;
}

export interface KeychainLoginResponse {
  success: boolean;
  error: string | null;
  result: string | null;
  data: KeychainLoginResponseData | null;
  message: string;
  request_id: number;
  publicKey?: string;
}
