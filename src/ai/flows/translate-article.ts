"use server";

/**
 * @fileOverview Article translation flow using the Gemini API.
 *
 * - translateArticle - A function that translates an article to a specified language.
 * - TranslateArticleInput - The input type for the translateArticle function.
 * - TranslateArticleOutput - The return type for the translateArticle function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const TranslateArticleInputSchema = z.object({
  article: z
    .string()
    .describe("The article text to translate (in Markdown format)."),
  targetLanguage: z
    .string()
    .default("English")
    .describe("The language to translate the article into."),
});

export type TranslateArticleInput = z.infer<typeof TranslateArticleInputSchema>;

const TranslatedArticleContentSchema = z.object({
  translatedArticle: z.string().describe("The translated article text."),
});

const TranslateArticleOutputSchema = z.object({
  translatedArticle: z.string().describe("The translated article text."),
  tokenUsage: z
    .object({
      totalTokens: z
        .number()
        .describe("Total tokens used for this translation."),
    })
    .describe("Token usage statistics for the translation."),
});

export type TranslateArticleOutput = z.infer<
  typeof TranslateArticleOutputSchema
>;

export async function translateArticle(
  input: TranslateArticleInput
): Promise<TranslateArticleOutput> {
  return translateArticleFlow(input);
}

const translationPrompt = ai.definePrompt({
  name: "translateArticlePrompt",
  input: { schema: TranslateArticleInputSchema },
  output: { schema: TranslatedArticleContentSchema },
  prompt: `Translate the following article into {{targetLanguage}}:

{{{article}}}`,
});

const translateArticleFlow = ai.defineFlow(
  {
    name: "translateArticleFlow",
    inputSchema: TranslateArticleInputSchema,
    outputSchema: TranslateArticleOutputSchema,
  },
  async (input) => {
    const result = await translationPrompt(input);

    if (!result.output) {
      throw new Error("Article translation failed: No output from LLM.");
    }

    return {
      translatedArticle: result.output.translatedArticle,
      tokenUsage: {
        totalTokens: result.usage?.totalTokens ?? 0,
      },
    };
  }
);
