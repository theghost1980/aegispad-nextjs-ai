import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { isValid: false, error: "API key is required and must be a string." },
        { status: 400 }
      );
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
      });
      const response = await model.countTokens("test");
      return NextResponse.json({ isValid: true });
    } catch (validationError: any) {
      console.warn(
        "Gemini API key validation failed on server:",
        validationError.message
      );
      // Analizar el error de Google para dar un mensaje más específico si es posible
      let errorMessage = "Invalid API Key or API error.";
      if (
        validationError.message &&
        validationError.message.includes("API key not valid")
      ) {
        errorMessage =
          "The provided API key is not valid. Please check the key and try again.";
      }
      return NextResponse.json(
        { isValid: false, error: errorMessage },
        { status: 200 }
      ); // Devolver 200 OK pero con isValid: false
    }
  } catch (error) {
    console.error("POST /api/ai/validate-gemini-key error:", error);
    return NextResponse.json(
      {
        isValid: false,
        error: "An unexpected server error occurred during key validation.",
      },
      { status: 500 }
    );
  }
}
