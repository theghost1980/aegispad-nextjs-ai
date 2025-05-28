import { MASTER_GEMINI_API_KEY } from "@/config/server-config";
import { GEMINI_AI_MODEL_NAME } from "@/constants/constants";
import { getProfileIdFromAuth } from "@/lib/auth/server.utils";
import { recordApiUsage } from "@/lib/supabase/api-usage";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"; // Importar el cliente de Supabase
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const profileId = await getProfileIdFromAuth(request);
  if (!profileId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: userProfile, error: profileError } = await supabase
    .from("profiles")
    .select("user_role")
    .eq("id", profileId)
    .single();

  if (profileError || !userProfile) {
    console.error("Error fetching user profile for role check:", profileError);
    return NextResponse.json(
      { message: "Error verifying user permissions" },
      { status: 500 }
    );
  }

  if (userProfile.user_role !== "admin") {
    console.warn(
      `User ${profileId} with role ${userProfile.user_role} attempted admin-only content creation.`
    );
    return NextResponse.json(
      {
        message:
          "Forbidden: You do not have permission to perform this action.",
      },
      { status: 403 }
    );
  }

  let prompt;
  try {
    const body = await request.json();
    prompt = body.prompt;
  } catch (e) {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json(
      { message: "Prompt is required and must be a string" },
      { status: 400 }
    );
  }

  if (!MASTER_GEMINI_API_KEY) {
    console.error(
      "MASTER_GEMINI_API_KEY is not available. Check server configuration."
    );
    return NextResponse.json(
      {
        message:
          "AI service for content generation is not configured correctly on the server.",
      },
      { status: 500 }
    );
  }
  try {
    const genAI = new GoogleGenerativeAI(MASTER_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: GEMINI_AI_MODEL_NAME,
    });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

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
        operationType: "ai_generate_content", // Specific identifier for this operation
        modelUsed: GEMINI_AI_MODEL_NAME,
        textTokensUsed: totalTokens, // Using totalTokens for text_tokens_used
        detailsJson: usageMetadata, // Store the full metadata for details
      });
    }

    return NextResponse.json({
      generatedText: text,
      // Optionally include token usage in the response to the client
      tokenUsage: usageMetadata,
    });
  } catch (e: any) {
    console.error("Error generating content with master Gemini key:", e);
    return NextResponse.json(
      { message: "Error generating content: " + e.message },
      { status: 500 }
    );
  }
}
