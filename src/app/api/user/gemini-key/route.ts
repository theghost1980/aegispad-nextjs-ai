import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
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

  try {
    const { encryptedGeminiApiKey } = await request.json();
    if (typeof encryptedGeminiApiKey !== "string") {
      return NextResponse.json(
        { message: "encryptedGeminiApiKey is required and must be a string." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceRoleClient();
    const { error } = await supabase
      .from("profiles")
      .update({ encrypted_gemini_api_key: encryptedGeminiApiKey })
      .eq("id", profileId);

    if (error) {
      console.error("Error updating Gemini API key in Supabase:", error);
      return NextResponse.json(
        { message: "Failed to save API key.", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "API key saved successfully." });
  } catch (error) {
    console.error("POST /api/user/gemini-key error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const profileId = await getProfileIdFromAuth(request);
  if (!profileId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("encrypted_gemini_api_key")
      .eq("id", profileId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116: no rows returned
      console.error("Error fetching Gemini API key from Supabase:", error);
      return NextResponse.json(
        { message: "Failed to fetch API key status.", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      encryptedApiKey: data?.encrypted_gemini_api_key || null,
    });
  } catch (error) {
    console.error("GET /api/user/gemini-key error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const profileId = await getProfileIdFromAuth(request);
  if (!profileId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("profiles")
    .update({ encrypted_gemini_api_key: null }) // Poner a null para "eliminarla"
    .eq("id", profileId);

  if (error) {
    console.error("Error deleting Gemini API key from Supabase:", error);
    return NextResponse.json(
      { message: "Failed to delete API key.", error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "API key deleted successfully." });
}
