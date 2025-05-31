import { useTranslations } from "next-intl";

export type ArticleForgePageTranslations = ReturnType<
  typeof useTranslations<"ArticleForgePage">
>;

export type TokenUsageTranslations = ReturnType<
  typeof useTranslations<"TokenUsage">
>;

export type LayoutTranslations = ReturnType<typeof useTranslations<"Layout">>;

export type HeaderTranslations = ReturnType<typeof useTranslations<"Header">>;

export type LanguageSwitcherTranslations = ReturnType<
  typeof useTranslations<"LanguageSwitcher">
>;

export type ArticleEditorTranslations = ReturnType<
  typeof useTranslations<"ArticleEditor">
>;

export type GlobalLoaderTranslations = ReturnType<
  typeof useTranslations<"GlobalLoader">
>;

export type MarkdownPreviewTranslations = ReturnType<
  typeof useTranslations<"MarkdownPreview">
>;

export type HomePageTranslations = ReturnType<
  typeof useTranslations<"HomePage">
>;

export type ErrorsTranslations = ReturnType<typeof useTranslations<"Errors">>;

export type TagInputTranslations = ReturnType<
  typeof useTranslations<"TagInput">
>;

export type TestingsPageTranslations = ReturnType<
  typeof useTranslations<"TestingsPage">
>;

export type GeminiKeyManagerErrorsTranslations = ReturnType<
  typeof useTranslations<"GeminiKeyManagerErrors">
>;

export type FaqPageTranslations = ReturnType<typeof useTranslations<"FaqPage">>;

export type OnboardingAssistantTranslations = ReturnType<
  typeof useTranslations<"OnboardingAssistant">
>;

export type UserAvatarDropdownTranslations = ReturnType<
  typeof useTranslations<"UserAvatarDropdown">
>;

export type ProfilePageTranslations = ReturnType<
  typeof useTranslations<"ProfilePage">
>;

export type LoginPageTranslations = ReturnType<
  typeof useTranslations<"LoginPage">
>;

export type FinalReviewPageTranslations = ReturnType<
  typeof useTranslations<"FinalReviewPage">
>;

export type FeedbackPageTranslations = ReturnType<
  typeof useTranslations<"FeedbackPage">
>;

export type MarkdownToolBarTranslations = ReturnType<
  typeof useTranslations<"MarkdownToolbar">
>;
