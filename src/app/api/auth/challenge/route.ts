import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const CHALLENGE_EXPIRATION_MINUTES = 5;

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { message: "Username is required and must be a string." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceRoleClient();

    const challengeString = randomBytes(32).toString("hex");

    const expiresAt = new Date(
      Date.now() + CHALLENGE_EXPIRATION_MINUTES * 60 * 1000
    ).toISOString();

    const { error: insertError } = await supabase
      .from("auth_challenges")
      .insert({
        hive_username: username,
        challenge_string: challengeString,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Error saving challenge to Supabase:", insertError);
      return NextResponse.json(
        {
          message: "Failed to generate challenge.",
          error: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ challenge: challengeString });
  } catch (error) {
    console.error("Challenge generation error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
