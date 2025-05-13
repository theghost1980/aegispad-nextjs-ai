// src/ai/flows/create-article.ts
'use server';
/**
 * @fileOverview Article creation flow using a prompt.
 *
 * - createArticle - A function that generates an article based on a prompt.
 * - CreateArticleInput - The input type for the createArticle function.
 * - CreateArticleOutput - The return type for the createArticle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateArticleInputSchema = z.object({
  prompt: z.string().describe('The prompt to generate an article from.'),
});
export type CreateArticleInput = z.infer<typeof CreateArticleInputSchema>;

const CreateArticleOutputSchema = z.object({
  article: z.string().describe('The generated article in Markdown format.'),
});
export type CreateArticleOutput = z.infer<typeof CreateArticleOutputSchema>;

export async function createArticle(input: CreateArticleInput): Promise<CreateArticleOutput> {
  return createArticleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createArticlePrompt',
  input: {schema: CreateArticleInputSchema},
  output: {schema: CreateArticleOutputSchema},
  prompt: `You are an expert article writer. Write an article of approximately 1000 words in Markdown format based on the following prompt:\n\nPrompt: {{{prompt}}}`,
});

const createArticleFlow = ai.defineFlow(
  {
    name: 'createArticleFlow',
    inputSchema: CreateArticleInputSchema,
    outputSchema: CreateArticleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
