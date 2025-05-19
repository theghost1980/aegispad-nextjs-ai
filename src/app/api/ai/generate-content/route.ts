import { decodeEncryptedApiKey } from "@/lib/encryption/server-encryption"; // Nuestra utilidad de desencriptación
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai"; // O el nuevo SDK cuando migres
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables.");
}

interface AuthenticatedRequestPayload {
  sub: string; // profile_id
  username: string;
  role?: string;
}

// Esta función debería moverse a una utilidad compartida, ej: src/lib/auth/server-utils.ts
async function getProfileIdFromAuth(
  request: NextRequest
): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token,
      JWT_SECRET!
    ) as AuthenticatedRequestPayload;
    return decoded.sub; // Este es el profile_id
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
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
    // Asegúrate de usar un nombre de modelo válido, como 'gemini-1.5-flash-latest'
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
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
