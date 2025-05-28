import { createSupabaseServiceRoleClient } from "./server";

interface ApiUsageData {
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
      // 'tokens_used' se deja con el default de la BD (0) o se calcula si es necesario.
      // Si 'text_tokens_used' es el total de texto, 'tokens_used' podría ser redundante o usarse para un total general.
      // Por ahora, confiamos en el default de la BD para 'tokens_used'.
    },
  ]);

  if (error) {
    console.error("Error recording API usage metrics:", error);
    // Considerar un sistema de reintentos o alertas para fallos críticos de registro.
    // Por ahora, solo logueamos el error para no bloquear la respuesta al usuario.
  }
}
