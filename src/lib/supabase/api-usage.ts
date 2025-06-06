import { createSupabaseServiceRoleClient } from "./server";

export interface ApiUsageData {
  profileId: string;
  operationType: string;
  modelUsed?: string;
  textTokensUsed?: number;
  imageTokensUsed?: number;
  apiProvider?: string;
  detailsJson?: Record<string, any>;
}

/**
 * Records API usage metrics for a user in the 'api_usage_metrics' table.
 * @param usageData - The data to record.
 */
export async function recordApiUsage(usageData: ApiUsageData): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();

  const { error } = await supabase.from("api_usage_metrics").insert([
    {
      profile_id: usageData.profileId,
      operation_type: usageData.operationType,
      model_used: usageData.modelUsed,
      text_tokens_used: usageData.textTokensUsed,
      image_tokens_used: usageData.imageTokensUsed,
      api_provider: usageData.apiProvider || "gemini",
      details_json: usageData.detailsJson,
    },
  ]);

  if (error) {
    console.error("Error recording API usage metrics:", error);
  }
}
