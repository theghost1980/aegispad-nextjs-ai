export type CombineFormatType =
  | "simple"
  | "detailsTag"
  | "inline"
  | "inComments";

export type InitialWorkflow = "aiCreate" | "userWrite";
export type ActiveEditorAction =
  | null
  | "revise"
  | "translate"
  | "combine"
  | "finalReview";
export type RevisionType = "full" | "selective";

export interface StoredArticleData {
  title: string;
  content: string;
}
