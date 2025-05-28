import { getProfileIdFromAuth } from "@/lib/auth/server.utils";
import { getUserSubscribedCommunities } from "@/lib/hive/server-utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const profileId = await getProfileIdFromAuth(request);
    if (!profileId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseServiceRoleClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("hive_username")
      .eq("id", profileId)
      .single();

    if (profileError || !profile || !profile.hive_username) {
      console.error(
        "Error fetching hive_username for subscriptions:",
        profileError
      );
      return NextResponse.json(
        { message: "User profile not found or hive_username missing" },
        { status: 404 }
      );
    }
    console.log("username:", profile.hive_username); //TODO REM
    const communities = await getUserSubscribedCommunities(
      profile.hive_username
    );
    console.log("Communities:", communities);

    if (communities === null) {
      return NextResponse.json(
        { message: "Failed to fetch subscribed communities" },
        { status: 500 }
      );
    }

    return NextResponse.json(communities);
  } catch (error: any) {
    console.error("API Error fetching hive subscriptions:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}
