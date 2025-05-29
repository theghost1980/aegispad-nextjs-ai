import { MASTER_GEMINI_API_KEY } from "@/config/server-config";
import { getProfileIdFromAuth } from "@/lib/auth/server.utils";
import { uploadFileToCloudinary } from "@/lib/cloudinary/server.utils"; // Import new function
import { ApiUsageData, recordApiUsage } from "@/lib/supabase/api-usage";
import { GoogleGenAI, Modality } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import * as crypto from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises"; // Added unlink
import * as path from "node:path";

const IMAGE_MODEL_NAME = "gemini-2.0-flash-preview-image-generation";

export async function POST(request: NextRequest) {
  const profileId = await getProfileIdFromAuth(request);
  if (!profileId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let prompt;
  let uploadToCloudinary = true; // Default to true, can be overridden by request body
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
    const ai = new GoogleGenAI({ apiKey: MASTER_GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const apiResponseObject = response;

    let imageBase64: string | undefined = undefined;
    let mimeType = "image/png";

    if (
      apiResponseObject.candidates &&
      apiResponseObject.candidates.length > 0 &&
      apiResponseObject.candidates[0].content &&
      apiResponseObject.candidates[0].content.parts &&
      apiResponseObject.candidates[0].content.parts.length > 0
    ) {
      const imagePart = apiResponseObject.candidates[0].content.parts.find(
        (part) => part.inlineData
      );
      if (imagePart && imagePart.inlineData) {
        imageBase64 = imagePart.inlineData.data;
        if (imagePart.inlineData.mimeType) {
          mimeType = imagePart.inlineData.mimeType;
        }
      }
    }

    if (!imageBase64 || typeof imageBase64 !== "string") {
      console.error(
        "La respuesta de la generación de imagen no contenía una imagen en base64 válida:",
        apiResponseObject
      );
      return NextResponse.json(
        // Ensure this is returned before trying to use imageBase64
        {
          message:
            "Failed to retrieve a valid image from the generation service.",
        },
        { status: 500 }
      );
    }

    // Record API usage now that we have a valid imageBase64
    const usageMetadata = apiResponseObject.usageMetadata;
    try {
      if (profileId) {
        const usageDataToStore: ApiUsageData = {
          profileId: profileId,
          operationType: "ai_generate_image",
          modelUsed: IMAGE_MODEL_NAME,
          textTokensUsed: usageMetadata?.promptTokenCount || 0,
          imageTokensUsed: usageMetadata?.candidatesTokenCount || 0,
          apiProvider: "google",
          detailsJson: {
            prompt,
            usageMetadata: usageMetadata,
          },
        };
        await recordApiUsage(usageDataToStore);
      }
    } catch (usageError) {
      console.error("Failed to record image generation usage:", usageError);
    }

    // If not uploading to Cloudinary, return base64 directly
    if (!uploadToCloudinary) {
      return NextResponse.json({
        message:
          "Imagen generada. Subida a Cloudinary no solicitada, devolviendo base64.",
        imageUrl: null,
        imageBase64: imageBase64,
        uploadStatus: "skipped_cloudinary",
        usageMetadata: usageMetadata,
      });
    }

    // Proceed with uploadToCloudinary = true
    // Save the image locally to public/temp with a random name
    const buffer = Buffer.from(imageBase64, "base64");
    let extension = ".png"; // Default extension
    if (mimeType === "image/jpeg") {
      extension = ".jpg";
    } else if (mimeType === "image/gif") {
      extension = ".gif";
    } else if (mimeType === "image/webp") {
      extension = ".webp";
    }

    const randomFileName = `${crypto
      .randomBytes(16)
      .toString("hex")}${extension}`;
    const tempDir = path.join(process.cwd(), "public", "temp");
    const filePath = path.join(tempDir, randomFileName);
    const publicImageUrl = `/temp/${randomFileName}`; // URL accessible by the client

    let finalImageUrl = publicImageUrl;
    let message = "Imagen generada y guardada localmente en 'public/temp'.";
    let uploadStatus: "local" | "cloudinary" | "failed" = "local";

    try {
      await mkdir(tempDir, { recursive: true }); // Ensure 'public/temp' directory exists
      await writeFile(filePath, buffer); // Asynchronously write the file

      if (uploadToCloudinary) {
        try {
          const cloudinaryUrl = await uploadFileToCloudinary(filePath);
          finalImageUrl = cloudinaryUrl;
          message = "Imagen generada y subida a Cloudinary.";
          uploadStatus = "cloudinary";
          // Optionally, delete the local file after successful upload to Cloudinary
          try {
            await unlink(filePath);
            console.log(
              `Archivo local ${filePath} eliminado después de subir a Cloudinary.`
            );
          } catch (deleteError) {
            console.error(
              `Error al eliminar el archivo local ${filePath}:`,
              deleteError
            );
            // Non-critical error, so we continue
          }
        } catch (cloudinaryError: any) {
          console.error(
            "Error uploading image to Cloudinary:",
            cloudinaryError
          );
          message = `Imagen generada y guardada localmente, pero falló la subida a Cloudinary: ${cloudinaryError.message}. Usando URL local.`;
          uploadStatus = "local";
        }
      }

      return NextResponse.json({
        message: message,
        imageUrl: finalImageUrl,
        uploadStatus: uploadStatus,
        usageMetadata: usageMetadata,
      });
    } catch (saveError: any) {
      console.error("Error saving image locally:", saveError);
      return NextResponse.json(
        {
          message: "Imagen generada, pero falló al guardarla localmente.",
          error: saveError.message,
          imageBase64: imageBase64,
          uploadStatus: "failed",
          usageMetadata: usageMetadata,
        },
        { status: 500 }
      );
    }
  } catch (e: any) {
    console.error("Error generating image with master Gemini key:", e);
    return NextResponse.json(
      { message: "Error generating image: " + e.message },
      { status: 500 }
    );
  }
}
