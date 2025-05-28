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
  try {
    const body = await request.json();
    articleContent = body.articleContent;
  } catch (e) {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  if (!articleContent || typeof articleContent !== "string") {
    return NextResponse.json(
      { message: "Article content is required and must be a string" },
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

    const revisionPrompt = `You are an expert editor. Please revise the following article text for clarity, grammar, spelling, punctuation, and style. Ensure the revised text flows well and is easy to read. Maintain the original language of the article. **Crucially, preserve all original Markdown formatting (like headers, lists, bold, italics, links, images, etc.).** Provide only the revised text in your response, without any additional commentary.

 Article Text:

 ${articleContent}`;

    const result = await model.generateContent(revisionPrompt);
    const response = result.response;
    const revisedText = response.text();

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
        operationType: "ai_revise_article", // Specific identifier for this operation
        modelUsed: GEMINI_AI_MODEL_NAME,
        textTokensUsed: totalTokens, // Using totalTokens for text_tokens_used
        detailsJson: usageMetadata, // Store the full metadata for details
      });
    }

    return NextResponse.json({
      revisedText: revisedText,
      // Optionally include token usage in the response to the client
      tokenUsage: usageMetadata,
    });
  } catch (e: any) {
    console.error("Error revising content with master Gemini key:", e);
    return NextResponse.json(
      { message: "Error revising content: " + e.message },
      { status: 500 }
    );
  }
}
