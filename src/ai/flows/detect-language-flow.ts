'use server';
/**
 * @fileOverview A Genkit flow to detect the language of a given text.
 *
 * - detectLanguage - A function that detects the language of a text.
 * - DetectLanguageInput - The input type for the detectLanguage function.
 * - DetectLanguageOutput - The return type for the detectLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectLanguageInputSchema = z.object({
  text: z.string().describe('The text content for which to detect the language.'),
});
export type DetectLanguageInput = z.infer<typeof DetectLanguageInputSchema>;

const DetectedLanguageContentSchema = z.object({
  language: z.string().describe('The detected language name (e.g., English, Spanish, French).'),
});

const DetectLanguageOutputSchema = z.object({
  language: z.string().describe('The detected language name (e.g., English, Spanish, French).'),
  tokenUsage: z.object({
    totalTokens: z.number().describe('Total tokens used for language detection.'),
  }).describe('Token usage statistics for the detection.'),
});
export type DetectLanguageOutput = z.infer<typeof DetectLanguageOutputSchema>;

export async function detectLanguage(input: DetectLanguageInput): Promise<DetectLanguageOutput> {
  return detectLanguageFlow(input);
}

const detectLanguagePrompt = ai.definePrompt({
  name: 'detectLanguagePrompt',
  input: {schema: DetectLanguageInputSchema},
  output: {schema: DetectedLanguageContentSchema},
  prompt: `Detect the language of the following text. Respond with only the common name of the language (e.g., 'English', 'Spanish', 'French'). Do not add any other words or explanations.

Text:
{{{text}}}`,
});

const detectLanguageFlow = ai.defineFlow(
  {
    name: 'detectLanguageFlow',
    inputSchema: DetectLanguageInputSchema,
    outputSchema: DetectLanguageOutputSchema,
  },
  async (input) => {
    const result = await detectLanguagePrompt(input);

    if (!result.output) {
      throw new Error('Language detection failed: No output from LLM.');
    }

    return {
      language: result.output.language,
      tokenUsage: {
        totalTokens: result.usage?.totalTokens ?? 0,
      },
    };
  }
);
