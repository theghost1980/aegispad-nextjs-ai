import { getProfileIdFromAuth } from "@/lib/auth/server.utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const profileId = await getProfileIdFromAuth(request);
  if (!profileId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const {
    overallRating,
    mostUsefulFeature,
    newFeatureSuggestion,
    generalComments,
  } = body;

  if (
    typeof overallRating !== "number" ||
    overallRating < 1 ||
    overallRating > 5
  ) {
    return NextResponse.json(
      { message: "Overall rating must be a number between 1 and 5." },
      { status: 400 }
    );
  }
  if (
    (mostUsefulFeature && typeof mostUsefulFeature !== "string") ||
    (newFeatureSuggestion && typeof newFeatureSuggestion !== "string") ||
    (generalComments && typeof generalComments !== "string")
  ) {
    return NextResponse.json(
      { message: "Text fields must be strings." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServiceRoleClient();

  const { error } = await supabase.from("feedback_submissions").insert({
    user_id: profileId,
    overall_rating: overallRating,
    most_useful_feature: mostUsefulFeature || null,
    new_feature_suggestions: newFeatureSuggestion || null,
    general_comments: generalComments || null,
  });

  if (error) {
    console.error("Error inserting feedback:", error);
    return NextResponse.json(
      { message: "Failed to submit feedback.", error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Feedback submitted successfully!" },
    { status: 201 }
  );
}
