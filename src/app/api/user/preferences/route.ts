import { getProfileIdFromAuth } from "@/lib/auth/server.utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const preferencesSchema = z.object({
  theme_preference: z.enum(["light", "dark", "system"]).optional(),
  login_redirect_preference: z.enum(["/", "/editor"]).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const profileId = await getProfileIdFromAuth(request);
    if (!profileId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsedPrefs = preferencesSchema.safeParse(body);

    if (!parsedPrefs.success) {
      return NextResponse.json(
        {
          message: "Invalid preferences data",
          errors: parsedPrefs.error.issues,
        },
        { status: 400 }
      );
    }

    if (Object.keys(parsedPrefs.data).length === 0) {
      return NextResponse.json(
        { message: "No preferences provided to update" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("profiles")
      .update(parsedPrefs.data)
      .eq("id", profileId)
      .select("theme_preference, login_redirect_preference")
      .single();

    if (error) {
      console.error("Error updating user preferences:", error);
      throw error;
    }

    return NextResponse.json({
      message: "Preferences updated successfully",
      preferences: data,
    });
  } catch (error: any) {
    console.error("API Error updating user preferences:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update preferences" },
      { status: 500 }
    );
  }
}
