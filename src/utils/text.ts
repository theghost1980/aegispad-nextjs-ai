/**
 * Counts the number of words in a given string.
 * Words are considered to be sequences of characters separated by whitespace.
 * @param text The string to count words from.
 * @returns The number of words in the text.
 */
export function countWords(text: string): number {
  if (!text || text.trim() === "") {
    return 0;
  }
  return text.trim().split(/\s+/).length;
}
