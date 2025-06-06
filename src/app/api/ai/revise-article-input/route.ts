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

  let articleContent: string;
  let taskType: "revise" | "revise_and_suggest_tags" = "revise";
  try {
    const body = await request.json();
    articleContent = body.articleContent;
    if (body.taskType === "revise_and_suggest_tags") {
      taskType = "revise_and_suggest_tags";
    }
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
    let prompt;
    if (taskType === "revise_and_suggest_tags") {
      prompt = `You are an expert editor and content analyst.
1. Please revise the following article text for clarity, grammar, spelling, punctuation, and style. Ensure the revised text flows well and is easy to read. Maintain the original language of the article. **Crucially, preserve all original Markdown formatting (like headers, lists, bold, italics, links, images, etc.).**
2. After the revised text, provide a section clearly marked as "Suggested Tags:" followed by a list of 3-5 relevant tags for the article. Each tag should be on a new line, prefixed with a hyphen (e.g., "- example-tag"). Tags should be lowercase, use only letters (a-z), numbers (0-9), and a single hyphen (-) for multi-word tags.

Provide only the revised text and the "Suggested Tags:" section in your response, without any additional commentary.

 Article Text:

 ${articleContent}`;
    } else {
      prompt = `You are an expert editor. Please revise the following article text for clarity, grammar, spelling, punctuation, and style. Ensure the revised text flows well and is easy to read. Maintain the original language of the article. **Crucially, preserve all original Markdown formatting (like headers, lists, bold, italics, links, images, etc.).** Provide only the revised text in your response, without any additional commentary.

 Article Text:

 ${articleContent}`;
    }
    const result = await model.generateContent(prompt);
    const response = result.response;
    const fullResponseText = response.text();

    const usageMetadata = response.usageMetadata;
    const promptTokens = usageMetadata?.promptTokenCount;
    const completionTokens = usageMetadata?.candidatesTokenCount;
    const totalTokens = usageMetadata?.totalTokenCount;

    let revisedText = fullResponseText;
    let suggestedTags: string[] = [];

    if (taskType === "revise_and_suggest_tags") {
      const tagSectionMarker = "Suggested Tags:";
      const tagSectionIndex = fullResponseText.indexOf(tagSectionMarker);

      if (tagSectionIndex !== -1) {
        revisedText = fullResponseText.substring(0, tagSectionIndex).trim();
        const tagsString = fullResponseText.substring(
          tagSectionIndex + tagSectionMarker.length
        );
        suggestedTags = tagsString
          .split("\n")
          .map((tag) => tag.replace(/^- /, "").trim())
          .filter(
            (tag) => tag.length > 0 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(tag)
          );
      }
    }

    if (profileId) {
      await recordApiUsage({
        profileId: profileId,
        operationType: `ai_revise_article${
          taskType === "revise_and_suggest_tags" ? "_with_tags" : ""
        }`,
        modelUsed: GEMINI_AI_MODEL_NAME,
        textTokensUsed: totalTokens,
        detailsJson: usageMetadata,
      });
    }

    return NextResponse.json({
      revisedText: revisedText,
      ...(taskType === "revise_and_suggest_tags" && {
        suggestedTags: suggestedTags,
      }),
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
