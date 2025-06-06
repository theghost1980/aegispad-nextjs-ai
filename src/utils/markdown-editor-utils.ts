import { ArticleForgePageTranslations } from "@/types/translation-types";

export interface MarkdownFormatResult {
  updatedMarkdown: string;
  newSelectionStart: number;
  newSelectionEnd: number;
}

const insertOrReplaceText = (
  originalText: string,
  textToInsert: string,
  selectionStart: number,
  selectionEnd: number
): string => {
  return (
    originalText.substring(0, selectionStart) +
    textToInsert +
    originalText.substring(selectionEnd)
  );
};

export const applyBoldFormat = (
  markdown: string,
  selectionStart: number,
  selectionEnd: number,
  placeholder: string
): MarkdownFormatResult => {
  const selectedText = markdown.substring(selectionStart, selectionEnd);
  const textToWrap = selectedText || placeholder;
  const formattedText = `**${textToWrap}**`;
  const updatedMarkdown = insertOrReplaceText(
    markdown,
    formattedText,
    selectionStart,
    selectionEnd
  );

  return {
    updatedMarkdown,
    newSelectionStart: selectionStart + 2,
    newSelectionEnd: selectionStart + 2 + textToWrap.length,
  };
};

export const applyItalicFormat = (
  markdown: string,
  selectionStart: number,
  selectionEnd: number,
  placeholder: string
): MarkdownFormatResult => {
  const selectedText = markdown.substring(selectionStart, selectionEnd);
  const textToWrap = selectedText || placeholder;
  const formattedText = `*${textToWrap}*`;
  const updatedMarkdown = insertOrReplaceText(
    markdown,
    formattedText,
    selectionStart,
    selectionEnd
  );

  return {
    updatedMarkdown,
    newSelectionStart: selectionStart + 1,
    newSelectionEnd: selectionStart + 1 + textToWrap.length,
  };
};

export const applyStrikethroughFormat = (
  markdown: string,
  selectionStart: number,
  selectionEnd: number,
  placeholder: string
): MarkdownFormatResult => {
  const selectedText = markdown.substring(selectionStart, selectionEnd);
  const textToWrap = selectedText || placeholder;
  const formattedText = `~~${textToWrap}~~`;
  const updatedMarkdown = insertOrReplaceText(
    markdown,
    formattedText,
    selectionStart,
    selectionEnd
  );

  return {
    updatedMarkdown,
    newSelectionStart: selectionStart + 2,
    newSelectionEnd: selectionStart + 2 + textToWrap.length,
  };
};

export const applyLinkFormat = (
  markdown: string,
  selectionStart: number,
  selectionEnd: number,
  linkTextPlaceholder: string,
  url: string
): MarkdownFormatResult => {
  const selectedText = markdown.substring(selectionStart, selectionEnd);
  const textToLink = selectedText || linkTextPlaceholder;
  const formattedText = `[${textToLink}](${url})`;
  const updatedMarkdown = insertOrReplaceText(
    markdown,
    formattedText,
    selectionStart,
    selectionEnd
  );

  return {
    updatedMarkdown,
    newSelectionStart: selectedText
      ? selectionStart + formattedText.length
      : selectionStart + 1,
    newSelectionEnd: selectedText
      ? selectionStart + formattedText.length
      : selectionStart + 1 + textToLink.length,
  };
};

export const applyHeadingFormat = (
  markdown: string,
  selectionStart: number,
  selectionEnd: number,
  placeholder: string,
  level: 1 | 2 | 3
): MarkdownFormatResult => {
  const selectedText = markdown.substring(selectionStart, selectionEnd);
  const textToHeader = selectedText || placeholder;
  const prefix = "#".repeat(level) + " ";

  let textToInsert = `${prefix}${textToHeader}`;
  let leadingNewline = "";

  if (selectionStart > 0 && markdown[selectionStart - 1] !== "\n") {
    leadingNewline = "\n";
  }
  const fullFormattedText = leadingNewline + textToInsert;

  const updatedMarkdown = insertOrReplaceText(
    markdown,
    fullFormattedText,
    selectionStart,
    selectionEnd
  );

  const initialCursorPos =
    selectionStart + leadingNewline.length + prefix.length;

  return {
    updatedMarkdown,
    newSelectionStart: initialCursorPos,
    newSelectionEnd: initialCursorPos + textToHeader.length,
  };
};

export const applyListFormat = (
  markdown: string,
  selectionStart: number,
  selectionEnd: number,
  placeholder: string,
  type: "ul" | "ol"
): MarkdownFormatResult => {
  const selectedText = markdown.substring(selectionStart, selectionEnd);
  const lines = (selectedText || placeholder).split("\n");

  const formattedLines = lines
    .map((line, index) => {
      const prefix = type === "ul" ? "- " : `${index + 1}. `;
      return `${prefix}${line}`;
    })
    .join("\n");

  const updatedMarkdown = insertOrReplaceText(
    markdown,
    formattedLines,
    selectionStart,
    selectionEnd
  );

  return {
    updatedMarkdown,
    newSelectionStart: selectionStart + formattedLines.length,
    newSelectionEnd: selectionStart + formattedLines.length,
  };
};

export const applyQuoteFormat = (
  markdown: string,
  selectionStart: number,
  selectionEnd: number,
  placeholder: string
): MarkdownFormatResult => {
  const selectedText = markdown.substring(selectionStart, selectionEnd);
  const textToQuote = selectedText || placeholder;

  const quotedLines = textToQuote
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");

  const updatedMarkdown = insertOrReplaceText(
    markdown,
    quotedLines,
    selectionStart,
    selectionEnd
  );

  return {
    updatedMarkdown,
    newSelectionStart: selectionStart + quotedLines.length,
    newSelectionEnd: selectionStart + quotedLines.length,
  };
};

export const applyCodeBlockFormat = (
  markdown: string,
  selectionStart: number,
  selectionEnd: number,
  placeholder: string
): MarkdownFormatResult => {
  const selectedText = markdown.substring(selectionStart, selectionEnd);
  const code = selectedText || placeholder;
  const formattedText = `\`\`\`\n${code}\n\`\`\``;
  const updatedMarkdown = insertOrReplaceText(
    markdown,
    formattedText,
    selectionStart,
    selectionEnd
  );

  return {
    updatedMarkdown,
    newSelectionStart: selectionStart + 4, // After ```\n
    newSelectionEnd: selectionStart + 4 + code.length,
  };
};

export const applyHorizontalRuleFormat = (
  markdown: string,
  selectionStart: number
): MarkdownFormatResult => {
  let prefix = "";
  if (selectionStart > 0 && markdown[selectionStart - 1] !== "\n") {
    prefix = "\n";
  }
  const hrText = `${prefix}---\n`;
  const updatedMarkdown =
    markdown.substring(0, selectionStart) +
    hrText +
    markdown.substring(selectionStart);

  return {
    updatedMarkdown,
    newSelectionStart: selectionStart + hrText.length,
    newSelectionEnd: selectionStart + hrText.length,
  };
};

export const applyImageUrlFormat = (
  markdown: string,
  selectionStart: number,
  selectionEnd: number,
  altText: string,
  imageUrl: string
): MarkdownFormatResult => {
  const imageMarkdown = `![${altText}](${imageUrl})`;
  const updatedMarkdown = insertOrReplaceText(
    markdown,
    imageMarkdown,
    selectionStart,
    selectionEnd
  );

  return {
    updatedMarkdown,
    newSelectionStart: selectionStart + imageMarkdown.length,
    newSelectionEnd: selectionStart + imageMarkdown.length,
  };
};

export const getToolbarFormatStrings = (t: ArticleForgePageTranslations) => {
  return {
    boldPlaceholder: t("toolbar.boldPlaceholder", {
      defaultValue: "bold text",
    }),
    italicPlaceholder: t("toolbar.italicPlaceholder", {
      defaultValue: "italic text",
    }),
    strikethroughPlaceholder: t("toolbar.strikethroughPlaceholder", {
      defaultValue: "strikethrough",
    }),
    linkPrompt: t("toolbar.linkPrompt", { defaultValue: "Enter link URL:" }),
    linkTextPlaceholder: t("toolbar.linkTextPlaceholder", {
      defaultValue: "link text",
    }),
    headingPlaceholder: t("toolbar.headingPlaceholder", {
      defaultValue: "Heading",
    }),
    listItemPlaceholder: t("toolbar.listItemPlaceholder", {
      defaultValue: "List item",
    }),
    quotePlaceholder: t("toolbar.quotePlaceholder", { defaultValue: "Quote" }),
    codeBlockPlaceholder: t("toolbar.codeBlockPlaceholder", {
      defaultValue: "code",
    }),
    imageUrlPrompt: t("toolbar.imageUrlPrompt", {
      defaultValue: "Enter image URL:",
    }),
    imageAltTextPrompt: t("toolbar.imageAltTextPrompt", {
      defaultValue: "Enter image alt text (optional):",
    }),
    aiImageAltTextDefault: t("toolbar.aiImageAltTextDefault", {
      defaultValue: "image",
    }),
  };
};

export const getGenerateSummaryTextForCopy = (
  t: ArticleForgePageTranslations,
  hiveUsername: string,
  userRole: string,
  detectedLanguage: string,
  sessionTotalTokens: number,
  sessionTextTokensUsed: number,
  sessionImageTokensUsed: number,
  finalCombinedOutput: string
) => {
  let summary = `${t("sessionSummaryCard.title")}\n`;
  summary += "=============================\n\n";
  summary += `${t("sessionSummaryCard.userLabel", {
    defaultValue: "User:",
  })} ${hiveUsername || "N/A"}\n`;
  summary += userRole === "admin" ? `User Role: ${userRole}\n` : "";
  summary += `${t("sessionSummaryCard.dateTimeLabel", {
    defaultValue: "Date/Time:",
  })} ${new Date().toLocaleString()}\n`;
  if (detectedLanguage) {
    summary += `${t(
      "sessionSummaryCard.detectedLanguageLabel"
    )} ${detectedLanguage}\n`;
  }
  summary += "\n";
  summary += `${t("sessionSummaryCard.tokenUsageTitle")}:\n`;
  summary += `-----------------------------\n`;
  summary += `${t(
    "sessionSummaryCard.totalTokensUsedLabel"
  )} ${sessionTotalTokens.toLocaleString()}\n`;
  if (sessionTextTokensUsed > 0) {
    summary += `  ${t(
      "sessionSummaryCard.textGenerationTokensLabel"
    )} ${sessionTextTokensUsed.toLocaleString()}\n`;
  }
  if (sessionImageTokensUsed > 0) {
    summary += `  ${t(
      "sessionSummaryCard.imageGenerationTokensLabel"
    )} ${sessionImageTokensUsed.toLocaleString()}\n`;
  }
  summary += "-----------------------------\n\n";

  if (finalCombinedOutput.trim()) {
    summary += `${t("refineFormatCard.combinedOutputTitle")}\n`;
    summary += "-----------------------------\n";
    summary += finalCombinedOutput;
  } else {
    summary += `${t("sessionSummaryCard.noFinalCombinedArticleMessage")}\n`;
  }
  return summary;
};
