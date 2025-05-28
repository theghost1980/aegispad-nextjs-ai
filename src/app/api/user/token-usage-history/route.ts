import { getProfileIdFromAuth } from "@/lib/auth/server.utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const RECORDS_LIMIT = 25;

export async function GET(request: NextRequest) {
  try {
    const profileId = await getProfileIdFromAuth(request);
    if (!profileId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseServiceRoleClient();

    const { data, error } = await supabase
      .from("api_usage_metrics")
      .select(
        "timestamp, operation_type, model_used, text_tokens_used, image_tokens_used, details_json"
      )
      .eq("profile_id", profileId)
      .order("timestamp", { ascending: false })
      .limit(RECORDS_LIMIT);

    if (error) {
      console.error("Error fetching token usage history:", error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API Error fetching token usage history:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch token usage history" },
      { status: 500 }
    );
  }
}
