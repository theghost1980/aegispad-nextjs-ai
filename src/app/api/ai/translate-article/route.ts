import { GEMINI_AI_MODEL_NAME } from "@/constants/constants";
import { getProfileIdFromAuth } from "@/lib/auth/server.utils";
import { decodeEncryptedApiKey } from "@/lib/encryption/server-encryption";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const profileId = await getProfileIdFromAuth(request);
  if (!profileId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let articleContent;
  let targetLanguage;
  try {
    const body = await request.json();
    // Esperamos que el cuerpo contenga el contenido del artículo y el idioma destino
    articleContent = body.articleContent;
    targetLanguage = body.targetLanguage;
  } catch (e) {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  if (!articleContent || typeof articleContent !== "string") {
    return NextResponse.json(
      { message: "Article content is required and must be a string" },
      { status: 400 }
    );
  }

  if (!targetLanguage || typeof targetLanguage !== "string") {
    return NextResponse.json(
      { message: "Target language is required and must be a string" },
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

    const translationPrompt = `Translate the following article, which is in Markdown format, into ${targetLanguage}.

**Important Instructions:**
1.  **Preserve all original Markdown formatting and syntax.** This includes, but is not limited to:
    *   Headings (e.g., # Title, ## Subtitle, ### Sub-subtitle)
    *   Bold text (**text** or __text__)
    *   Italic text (*text* or _text_)
    *   Strikethrough text (~~text~~)
    *   Links (link text)
    *   Images (!alt text)
    *   Unordered lists (*, -, +)
    *   Ordered lists (1., 2.)
    *   Blockquotes (> quote)
    *   Code blocks (indented or fenced with \`\`\`)
    *   Inline code (\`code\`)
    *   Horizontal rules (---, ***, ___)
    *   Tables
2.  Translate only the textual content found within the Markdown structure. Do not translate Markdown syntax characters themselves.
3.  Your response must be *only* the translated Markdown content. Do not add any introductory phrases, concluding remarks, or explanations.
4.  Do not wrap the entire output in an additional Markdown code block unless the original input itself was a single, complete code block.

Original Markdown Article Text:

 ${articleContent}`;

    const result = await model.generateContent(translationPrompt);
    const response = result.response;
    const translatedText = response.text();

    // TODO: Considerar el conteo de tokens y el manejo de cuotas aquí

    // Devolvemos el texto traducido
    return NextResponse.json({ translatedText: translatedText });
  } catch (e: any) {
    console.error("Error translating content with user's Gemini key:", e);
    return NextResponse.json(
      { message: "Error translating content: " + e.message },
      { status: 500 }
    );
  }
}
