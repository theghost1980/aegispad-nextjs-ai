"use server";

/**
 * @fileOverview AI agent to revise an existing article for grammar, style, and clarity.
 *
 * - reviseArticle - A function that handles the article revision process.
 * - ReviseArticleInput - The input type for the reviseArticle function.
 * - ReviseArticleOutput - The return type for the reviseArticle function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const ReviseArticleInputSchema = z.object({
  article: z
    .string()
    .describe("The article text to revise in Markdown format."),
});
export type ReviseArticleInput = z.infer<typeof ReviseArticleInputSchema>;

const RevisedArticleContentSchema = z.object({
  revisedArticle: z
    .string()
    .describe("The revised article text in Markdown format."),
});

const ReviseArticleOutputSchema = z.object({
  revisedArticle: z
    .string()
    .describe("The revised article text in Markdown format."),
  tokenUsage: z
    .object({
      totalTokens: z.number().describe("Total tokens used for this revision."),
    })
    .describe("Token usage statistics for the revision."),
});
export type ReviseArticleOutput = z.infer<typeof ReviseArticleOutputSchema>;

export async function reviseArticle(
  input: ReviseArticleInput
): Promise<ReviseArticleOutput> {
  return reviseArticleFlow(input);
}

const revisionPrompt = ai.definePrompt({
  name: "reviseArticlePrompt",
  input: { schema: ReviseArticleInputSchema },
  output: { schema: RevisedArticleContentSchema },
  prompt: `You are an expert editor. Please review the following article and improve its grammar, spelling, style, clarity, and flow. Return the entire revised article in Markdown format.

Article:
{{{article}}}`,
});

const reviseArticleFlow = ai.defineFlow(
  {
    name: "reviseArticleFlow",
    inputSchema: ReviseArticleInputSchema,
    outputSchema: ReviseArticleOutputSchema,
  },
  async (input) => {
    const result = await revisionPrompt(input);

    if (!result.output) {
      throw new Error("Article revision failed: No output from LLM.");
    }

    return {
      revisedArticle: result.output.revisedArticle,
      tokenUsage: {
        totalTokens: result.usage?.totalTokens ?? 0,
      },
    };
  }
);
