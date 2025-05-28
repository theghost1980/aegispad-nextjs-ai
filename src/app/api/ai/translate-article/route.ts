import { MASTER_GEMINI_API_KEY } from "@/config/server-config";
import { GEMINI_AI_MODEL_NAME } from "@/constants/constants";
import { getProfileIdFromAuth } from "@/lib/auth/server.utils";
import { recordApiUsage } from "@/lib/supabase/api-usage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const profileId = await getProfileIdFromAuth(request);
  if (!profileId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let articleContent;
  let targetLanguage;
  try {
    const body = await request.json();
    articleContent = body.articleContent;
    targetLanguage = body.targetLanguage;
  } catch (e) {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  if (!articleContent || typeof articleContent !== "string") {
    return NextResponse.json(
      { message: "Article content is required and must be a string" },
      { status: 400 }
    );
  }

  if (!targetLanguage || typeof targetLanguage !== "string") {
    return NextResponse.json(
      { message: "Target language is required and must be a string" },
      { status: 400 }
    );
  }

  if (!MASTER_GEMINI_API_KEY) {
    console.error(
      "MASTER_GEMINI_API_KEY is not available. Check server configuration."
    );
    return NextResponse.json(
      {
        message: "AI service is not configured correctly on the server.",
      },
      { status: 500 }
    );
  }
  try {
    const genAI = new GoogleGenerativeAI(MASTER_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: GEMINI_AI_MODEL_NAME,
    });

    const translationPrompt = `Translate the following article, which is in Markdown format, into ${targetLanguage}.

**Important Instructions:**
1.  **Preserve all original Markdown formatting and syntax.** This includes, but is not limited to:
    *   Headings (e.g., # Title, ## Subtitle, ### Sub-subtitle)
    *   Bold text (**text** or __text__)
    *   Italic text (*text* or _text_)
    *   Strikethrough text (~~text~~)
    *   Links (link text)
    *   Images (!alt text)
    *   Unordered lists (*, -, +)
    *   Ordered lists (1., 2.)
    *   Blockquotes (> quote)
    *   Code blocks (indented or fenced with \`\`\`)
    *   Inline code (\`code\`)
    *   Horizontal rules (---, ***, ___, &lt;hr /&gt;, &lt;hr/&gt;)
    *   Tables
2.  Translate only the textual content found within the Markdown structure. Do not translate Markdown syntax characters themselves.
3.  Your response must be *only* the translated Markdown content. Do not add any introductory phrases, concluding remarks, or explanations.
4.  Do not wrap the entire output in an additional Markdown code block unless the original input itself was a single, complete code block.

Original Markdown Article Text:

 ${articleContent}`;

    const result = await model.generateContent(translationPrompt);
    const response = result.response;
    const translatedText = response.text();

    // Extract token usage from the response metadata
    const usageMetadata = response.usageMetadata;
    const promptTokens = usageMetadata?.promptTokenCount;
    const completionTokens = usageMetadata?.candidatesTokenCount;
    const totalTokens = usageMetadata?.totalTokenCount;

    // Record the usage in the database
    if (profileId) {
      // Ensure profileId is available
      await recordApiUsage({
        profileId: profileId,
        operationType: "ai_translate_article", // Specific identifier for this operation
        modelUsed: GEMINI_AI_MODEL_NAME,
        textTokensUsed: totalTokens, // Using totalTokens for text_tokens_used
        detailsJson: usageMetadata, // Store the full metadata for details
      });
    }

    // Devolvemos el texto traducido
    return NextResponse.json({
      translatedText: translatedText,
      // Optionally include token usage in the response to the client
      tokenUsage: usageMetadata,
    });
  } catch (e: any) {
    console.error("Error translating content with master Gemini key:", e);
    return NextResponse.json(
      { message: "Error translating content: " + e.message },
      { status: 500 }
    );
  }
}
