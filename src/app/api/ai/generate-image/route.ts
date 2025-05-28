import { MASTER_GEMINI_API_KEY } from "@/config/server-config";
import { getProfileIdFromAuth } from "@/lib/auth/server.utils";
import { uploadBase64ToCloudinary } from "@/lib/cloudinary/server.utils";
import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const IMAGE_GENERATION_MODEL_NAME = "imagen-3.0";
interface ImageGenerativeModel extends GenerativeModel {
  generateImage: (
    prompt: string
  ) => Promise<{ image: string; [key: string]: any }>;
}

export async function POST(request: NextRequest) {
  const profileId = await getProfileIdFromAuth(request);
  if (!profileId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let prompt;
  let uploadToCloudinary = true;
  try {
    const body = await request.json();
    prompt = body.prompt;
    if (typeof body.uploadToCloudinary === "boolean") {
      uploadToCloudinary = body.uploadToCloudinary;
    }
  } catch (e) {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json(
      { message: "A prompt is required and must be a string" },
      { status: 400 }
    );
  }

  if (!MASTER_GEMINI_API_KEY) {
    console.error(
      "MASTER_GEMINI_API_KEY is not available. Check server configuration."
    );
    return NextResponse.json(
      {
        message:
          "AI service for image generation is not configured correctly on the server.",
      },
      { status: 500 }
    );
  }
  try {
    const genAI = new GoogleGenerativeAI(MASTER_GEMINI_API_KEY);
    // Usamos el nombre del modelo de tu ejemplo.
    // Es importante notar que el SDK @google/generative-ai podría no tener
    // un método `generateImage` directamente en los modelos que obtiene de esta forma,
    // o podría no ser compatible con "imagen-3.0" a través de esta inicialización.
    // Esta implementación sigue tu ejemplo de `ImageGenerator`.
    const model = genAI.getGenerativeModel({
      model: IMAGE_GENERATION_MODEL_NAME,
    }) as ImageGenerativeModel;

    if (typeof model.generateImage !== "function") {
      console.error(
        `El modelo '${IMAGE_GENERATION_MODEL_NAME}' obtenido a través de GoogleGenerativeAI no tiene un método 'generateImage'. Verifica la compatibilidad del SDK y el modelo.`
      );
      return NextResponse.json(
        {
          message: `Model '${IMAGE_GENERATION_MODEL_NAME}' does not support direct image generation via this method or SDK.`,
        },
        { status: 501 }
      );
    }

    const result = await model.generateImage(prompt);

    const imageBase64 = result.image;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      console.error(
        "La respuesta de la generación de imagen no contenía una imagen en base64 válida:",
        result
      );
      return NextResponse.json(
        {
          message:
            "Failed to retrieve a valid image from the generation service.",
        },
        { status: 500 }
      );
    }

    // TODO: [HIGH PRIORITY] Implement cost/usage tracking for image generation.
    // This is different from text token counting.
    // 1. Determine how Gemini/Imagen API reports usage for image generation (e.g., per image, dimensions, steps).
    // 2. Include this usage information in the JSON response if available.
    // 3. (Future) Implement a reusable backend function `recordImageGenerationUsage(profileId, modelName, count, metadata)`
    //    to log usage to Supabase.

    if (uploadToCloudinary) {
      try {
        const imageUrl = await uploadBase64ToCloudinary(imageBase64);
        return NextResponse.json({ imageUrl: imageUrl });
      } catch (uploadError: any) {
        console.error("Error uploading image to Cloudinary:", uploadError);
        return NextResponse.json(
          {
            message: `Image generated, but failed to upload to Cloudinary: ${uploadError.message}`,
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json({ imageBase64: imageBase64 });
    }
  } catch (e: any) {
    console.error("Error generating image with master Gemini key:", e);
    return NextResponse.json(
      { message: "Error generating image: " + e.message },
      { status: 500 }
    );
  }
}
