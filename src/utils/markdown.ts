/**
 * Splits a Markdown string into an array of segments, treating paragraphs and list items as separate units.
 * Segments are typically separated by one or more blank lines (paragraphs)
 * or by a newline followed by a list marker (unordered or ordered).
 * This implementation aims to handle basic lists correctly for inline combination.
 * @param markdown The Markdown string to split.
 * @returns An array of strings, where each string is a paragraph or a list item.
 */
export const splitMarkdownIntoParagraphs = (markdown: string): string[] => {
  const normalizedMarkdown = markdown.replace(/\r\n|\r/g, "\n");
  const segments = normalizedMarkdown.split(
    /\n\s*\n+|\n(?=\s*[\-*+] |\s*\d+\. )/
  );
  return segments
    .map((segment) => segment.trim())
    .filter((segment) => segment !== "");
};
