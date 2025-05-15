// src/ai/flows/create-article.ts
"use server";
/**
 * @fileOverview Article creation flow using a prompt, with an option to generate a main image.
 *
 * - createArticle - A function that generates an article based on a prompt.
 * - CreateArticleInput - The input type for the createArticle function.
 * - CreateArticleOutput - The return type for the createArticle function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const CreateArticleInputSchema = z.object({
  prompt: z.string().describe("The prompt to generate an article from."),
  generateMainImage: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to generate a main image for the article."),
  language: z
    .string()
    .default("English")
    .describe("The language in which to generate the article."), // <--- AÑADE ESTA LÍNEA
});
export type CreateArticleInput = z.infer<typeof CreateArticleInputSchema>;

// Schema for the direct output from the LLM model for article content
const ArticleContentSchema = z.object({
  article: z.string().describe("The generated article in Markdown format."),
});

// Schema for the flow's output, including token usage and image details
const CreateArticleOutputSchema = z.object({
  article: z
    .string()
    .describe(
      "The generated article in Markdown format (may include a prepended image)."
    ),
  mainImageUrl: z
    .string()
    .optional()
    .describe("Data URI of the generated main image, if requested."),
  mainImagePrompt: z
    .string()
    .optional()
    .describe("The prompt used for generating the main image, if requested."),
  tokenUsage: z
    .object({
      totalTokens: z
        .number()
        .describe("Total tokens used for this operation (text + image)."),
      textGenerationTokens: z
        .number()
        .optional()
        .describe("Tokens used specifically for text generation."),
      imageGenerationTokens: z
        .number()
        .optional()
        .describe("Tokens used specifically for image generation."),
    })
    .describe("Token usage statistics for the generation."),
});
export type CreateArticleOutput = z.infer<typeof CreateArticleOutputSchema>;

export async function createArticle(
  input: CreateArticleInput
): Promise<CreateArticleOutput> {
  return createArticleFlow(input);
}

const articlePrompt = ai.definePrompt({
  name: "createArticlePrompt",
  // El input del prompt ahora puede ser solo el texto final que construimos
  input: {
    schema: z.object({
      // promptText: z.string() // Cambiamos el nombre para evitar confusión con el input.prompt original
      // O, si el prompt template va a usar {{language}} y {{prompt}} directamente:
      prompt: CreateArticleInputSchema.shape.prompt,
      language: CreateArticleInputSchema.shape.language,
    }),
  },
  output: { schema: ArticleContentSchema }, // LLM directly outputs this
  prompt: `You are an expert article writer. Write an article of approximately 1000 words in {{language}} in Markdown format based on the following prompt:\n\nPrompt: {{{prompt}}}`,
});

const createArticleFlow = ai.defineFlow(
  {
    name: "createArticleFlow",
    inputSchema: CreateArticleInputSchema,
    outputSchema: CreateArticleOutputSchema,
  },
  async (input) => {
    let textGenerationUsage = 0;
    let imageGenerationUsage = 0;
    let mainImageUrl: string | undefined = undefined;
    let mainImageAIGenerationPrompt: string | undefined = undefined;

    // 1. Generate article text
    // Construimos el prompt para la IA incluyendo el idioma
    // const promptForAI = `Escribe un artículo en ${input.language} sobre: ${input.prompt}`;
    const articleResult = await articlePrompt({
      prompt: input.prompt,
      language: input.language,
    });
    if (!articleResult.output) {
      throw new Error(
        "Article generation failed: No output from LLM for text content."
      );
    }
    let articleContent = articleResult.output.article;
    textGenerationUsage = articleResult.usage?.totalTokens ?? 0;

    // 2. Generate main image if requested
    if (input.generateMainImage) {
      mainImageAIGenerationPrompt = `Generate a high-quality, visually appealing, and relevant main image for an article with the following topic: "${input.prompt.substring(
        0,
        250
      )}${
        input.prompt.length > 250 ? "..." : ""
      }". The image should be suitable as a header or cover image for a blog post or online article.`;

      try {
        const imageGenerationResult = await ai.generate({
          model: "googleai/gemini-2.0-flash-exp", // Specific model for image generation
          prompt: mainImageAIGenerationPrompt,
          config: {
            responseModalities: ["TEXT", "IMAGE"],
            safetySettings: [
              // Added safety settings to be less restrictive for DANGEROUS_CONTENT
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE",
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
            ],
          },
        });

        if (imageGenerationResult.media && imageGenerationResult.media.url) {
          mainImageUrl = imageGenerationResult.media.url;
          // Prepend image to article markdown
          articleContent = `![Main Article Image](${mainImageUrl})\n\n${articleContent}`;
          imageGenerationUsage = imageGenerationResult.usage?.totalTokens ?? 0;
        } else {
          console.warn(
            "Image generation was requested but did not return a media URL. Proceeding without image."
          );
          // No error thrown, article proceeds without image
        }
      } catch (error) {
        console.error("Error during main image generation:", error);
        // Log error and continue without image, don't let image failure block article creation
      }
    }

    return {
      article: articleContent,
      mainImageUrl,
      mainImagePrompt: mainImageAIGenerationPrompt,
      tokenUsage: {
        totalTokens: textGenerationUsage + imageGenerationUsage,
        textGenerationTokens: textGenerationUsage,
        imageGenerationTokens:
          imageGenerationUsage > 0 ? imageGenerationUsage : undefined,
      },
    };
  }
);
