import { GEMINI_AI_MODEL_NAME } from "@/constants/constants";
import { getProfileIdFromAuth } from "@/lib/auth/server.utils";
import { decodeEncryptedApiKey } from "@/lib/encryption/server-encryption";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables.");
}

export async function POST(request: NextRequest) {
  const profileId = await getProfileIdFromAuth(request);
  if (!profileId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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

  const supabase = createSupabaseServiceRoleClient();
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("encrypted_gemini_api_key")
    .eq("id", profileId)
    .single();

  if (profileError || !profileData || !profileData.encrypted_gemini_api_key) {
    return NextResponse.json(
      {
        message:
          "Gemini API key not configured for this user. Please configure it in your profile.",
      },
      { status: 400 }
    );
  }

  const userGeminiApiKey = decodeEncryptedApiKey(
    profileData.encrypted_gemini_api_key
  );

  if (!userGeminiApiKey) {
    return NextResponse.json(
      {
        message:
          "Failed to decode Gemini API key. It might be corrupted or the server configuration is incorrect.",
      },
      { status: 500 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(userGeminiApiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_AI_MODEL_NAME,
    });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // TODO: Considerar el conteo de tokens y el manejo de cuotas aquí

    return NextResponse.json({ generatedText: text });
  } catch (e: any) {
    console.error("Error generating content with user's Gemini key:", e);
    return NextResponse.json(
      { message: "Error generating content: " + e.message },
      { status: 500 }
    );
  }
}
