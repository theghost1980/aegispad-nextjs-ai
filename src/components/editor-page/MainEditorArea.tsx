"use client";

import { MarkdownPreviewComponent } from "@/components/editor-page/MarkdownPreviewComponent";
import {
  MarkdownFormatType,
  MarkdownToolbar,
} from "@/components/editor-sections/MarkdownToolbar";
import { MarkdownToolBarTranslations } from "@/types/translation-types";
import * as MarkdownEditorUtils from "@/utils/markdown-editor-utils";
import React from "react";

interface ToolbarFormatStrings {
  boldPlaceholder: string;
  italicPlaceholder: string;
  strikethroughPlaceholder: string;
  linkPrompt: string;
  linkTextPlaceholder: string;
  headingPlaceholder: string;
  listItemPlaceholder: string;
  quotePlaceholder: string;
  codeBlockPlaceholder: string;
  imageUrlPrompt: string;
  imageAltTextPrompt: string;
  aiImageAltTextDefault: string;
}

interface MainEditorAreaProps {
  articleMarkdown: string;
  onArticleMarkdownChange: (newMarkdown: string) => void;
  isLoading: boolean;
  isPreviewExpanded: boolean;
  previewLayout: "side" | "bottom";
  onToggleLayout: () => void;
  onToggleImageModal: () => void;
  onAIImageGenerated: (imageUrl: string, altText?: string) => void;
  onTriggerDeviceImageUpload: () => void;
  mainTextareaRef: React.RefObject<HTMLTextAreaElement>;
  tMarkdownToolBar: MarkdownToolBarTranslations;
  editorPlaceholder: string;
  previewTitle: string;
  toolbarFormatStrings: ToolbarFormatStrings;
}

export const MainEditorArea: React.FC<MainEditorAreaProps> = ({
  articleMarkdown,
  onArticleMarkdownChange,
  isLoading,
  isPreviewExpanded,
  previewLayout,
  onToggleLayout,
  onToggleImageModal,
  onAIImageGenerated,
  onTriggerDeviceImageUpload,
  mainTextareaRef,
  tMarkdownToolBar,
  editorPlaceholder,
  previewTitle,
  toolbarFormatStrings,
}) => {
  const handleApplyFormat = (formatType: MarkdownFormatType) => {
    const textarea = mainTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let result: MarkdownEditorUtils.MarkdownFormatResult | null = null;

    switch (formatType) {
      case "bold":
        result = MarkdownEditorUtils.applyBoldFormat(
          articleMarkdown,
          start,
          end,
          toolbarFormatStrings.boldPlaceholder
        );
        break;
      case "italic":
        result = MarkdownEditorUtils.applyItalicFormat(
          articleMarkdown,
          start,
          end,
          toolbarFormatStrings.italicPlaceholder
        );
        break;
      case "strikethrough":
        result = MarkdownEditorUtils.applyStrikethroughFormat(
          articleMarkdown,
          start,
          end,
          toolbarFormatStrings.strikethroughPlaceholder
        );
        break;
      case "link":
        const urlFromPrompt = window.prompt(
          toolbarFormatStrings.linkPrompt,
          "https://"
        );
        if (urlFromPrompt) {
          result = MarkdownEditorUtils.applyLinkFormat(
            articleMarkdown,
            start,
            end,
            toolbarFormatStrings.linkTextPlaceholder,
            urlFromPrompt
          );
        } else {
          return;
        }
        break;
      case "h1":
      case "h2":
      case "h3":
        const headingLevel =
          formatType === "h1" ? 1 : formatType === "h2" ? 2 : 3;
        result = MarkdownEditorUtils.applyHeadingFormat(
          articleMarkdown,
          start,
          end,
          toolbarFormatStrings.headingPlaceholder,
          headingLevel as 1 | 2 | 3
        );
        break;
      case "ul":
      case "ol":
        result = MarkdownEditorUtils.applyListFormat(
          articleMarkdown,
          start,
          end,
          toolbarFormatStrings.listItemPlaceholder,
          formatType
        );
        break;
      case "quote":
        result = MarkdownEditorUtils.applyQuoteFormat(
          articleMarkdown,
          start,
          end,
          toolbarFormatStrings.quotePlaceholder
        );
        break;
      case "codeblock":
        result = MarkdownEditorUtils.applyCodeBlockFormat(
          articleMarkdown,
          start,
          end,
          toolbarFormatStrings.codeBlockPlaceholder
        );
        break;
      case "hr":
        result = MarkdownEditorUtils.applyHorizontalRuleFormat(
          articleMarkdown,
          start
        );
        break;
      case "image_url":
        const imageUrlFromPrompt = window.prompt(
          toolbarFormatStrings.imageUrlPrompt
        );
        if (imageUrlFromPrompt) {
          const altText =
            window.prompt(toolbarFormatStrings.imageAltTextPrompt) ||
            toolbarFormatStrings.aiImageAltTextDefault;
          result = MarkdownEditorUtils.applyImageUrlFormat(
            articleMarkdown,
            start,
            end,
            altText,
            imageUrlFromPrompt
          );
        } else {
          return;
        }
        break;
      default:
        return;
    }

    if (result) {
      onArticleMarkdownChange(result.updatedMarkdown);
      setTimeout(() => {
        if (mainTextareaRef.current) {
          mainTextareaRef.current.focus();
          mainTextareaRef.current.setSelectionRange(
            result.newSelectionStart,
            result.newSelectionEnd
          );
        }
      }, 0);
    }
  };

  return (
    <div
      className={`
        ${
          isPreviewExpanded && previewLayout === "side"
            ? "flex flex-col md:flex-row gap-4"
            : "flex flex-col"
        }
      `}
    >
      <div
        className={
          isPreviewExpanded && previewLayout === "side"
            ? "w-full md:w-1/2 flex flex-col"
            : "w-full"
        }
      >
        <MarkdownToolbar
          onApplyFormat={handleApplyFormat}
          onToggleImageModal={onToggleImageModal}
          disabled={isLoading}
          onToggleLayout={onToggleLayout}
          currentLayout={previewLayout}
          onAIImageGenerated={onAIImageGenerated}
          onTriggerDeviceImageUpload={onTriggerDeviceImageUpload}
          t={tMarkdownToolBar}
        />
        <textarea
          ref={mainTextareaRef}
          value={articleMarkdown}
          onChange={(e) => onArticleMarkdownChange(e.target.value)}
          placeholder={editorPlaceholder}
          className="w-full min-h-[300px] p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary-focus transition-shadow bg-background flex-grow"
          disabled={isLoading}
        />
      </div>

      {isPreviewExpanded && (
        <div
          className={
            isPreviewExpanded && previewLayout === "side"
              ? "w-full md:w-1/2"
              : "w-full mt-4"
          }
        >
          <MarkdownPreviewComponent
            content={articleMarkdown}
            title={previewTitle}
          />
        </div>
      )}
    </div>
  );
};
