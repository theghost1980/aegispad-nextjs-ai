// src/ai/flows/translate-article.ts
'use server';

/**
 * @fileOverview Article translation flow using the Gemini API.
 *
 * - translateArticle - A function that translates an article to a specified language.
 * - TranslateArticleInput - The input type for the translateArticle function.
 * - TranslateArticleOutput - The return type for the translateArticle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateArticleInputSchema = z.object({
  article: z.string().describe('The article text to translate (in Markdown format).'),
  targetLanguage: z.string().default('English').describe('The language to translate the article into.'),
});

export type TranslateArticleInput = z.infer<typeof TranslateArticleInputSchema>;

const TranslateArticleOutputSchema = z.object({
  translatedArticle: z.string().describe('The translated article text.'),
});

export type TranslateArticleOutput = z.infer<typeof TranslateArticleOutputSchema>;

export async function translateArticle(input: TranslateArticleInput): Promise<TranslateArticleOutput> {
  return translateArticleFlow(input);
}

const translateArticlePrompt = ai.definePrompt({
  name: 'translateArticlePrompt',
  input: {schema: TranslateArticleInputSchema},
  output: {schema: TranslateArticleOutputSchema},
  prompt: `Translate the following article into {{targetLanguage}}:

{{{article}}}`,
});

const translateArticleFlow = ai.defineFlow(
  {
    name: 'translateArticleFlow',
    inputSchema: TranslateArticleInputSchema,
    outputSchema: TranslateArticleOutputSchema,
  },
  async input => {
    const {output} = await translateArticlePrompt(input);
    return output!;
  }
);
