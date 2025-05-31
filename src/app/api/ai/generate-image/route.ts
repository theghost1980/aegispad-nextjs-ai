import { MASTER_GEMINI_API_KEY } from "@/config/server-config";
import { getProfileIdFromAuth } from "@/lib/auth/server.utils";
import { ApiUsageData, recordApiUsage } from "@/lib/supabase/api-usage";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { DeterminedStorageInfo } from "@/types/general.types";
import { getDeterminedStorageService } from "@/utils/imageStorageService";
import { GoogleGenAI, Modality } from "@google/genai";
import { PrivateKey } from "@hiveio/dhive";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const IMAGE_MODEL_NAME = "gemini-2.0-flash-preview-image-generation";

const HIVE_UPLOAD_ACCOUNT_NAME = process.env.HIVE_UPLOAD_ACCOUNT_NAME;
const HIVE_UPLOAD_POSTING_KEY = process.env.POSTING_KEY;

if (
  process.env.NEXT_PUBLIC_CLOUD_NAME &&
  process.env.API_KEY &&
  process.env.API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    secure: true,
  });
}

export async function POST(request: NextRequest) {
  const profileId = await getProfileIdFromAuth(request);
  if (!profileId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let prompt;
  try {
    const body = await request.json();
    prompt = body.prompt;
    // La variable uploadToCloudinary ya no se usa, se elimina la lógica asociada.
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

    // Convertir base64 a Buffer
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

    // Determinar el servicio de almacenamiento
    let storageServiceInfo = await getDeterminedStorageService();
    let uploadedImageUrl: string;
    let uploadedServiceMetadata: any;

    // Función adaptada para subir el buffer al servicio determinado
    async function uploadBufferToStorageService(
      imgBuffer: Buffer,
      fileName: string,
      imgMimeType: string | null,
      serviceInfo: DeterminedStorageInfo
    ): Promise<{ imageUrl: string; serviceMetadata?: any }> {
      console.log(
        `[GenImgAPI] Intentando subir ${fileName} a ${serviceInfo.name} (${
          serviceInfo.url || "configuración de fallback"
        })`
      );

      if (serviceInfo.type === "primary" && serviceInfo.url) {
        if (
          serviceInfo.name === "Hive Images" ||
          serviceInfo.name === "Ecency Images"
        ) {
          if (!HIVE_UPLOAD_ACCOUNT_NAME || !HIVE_UPLOAD_POSTING_KEY) {
            throw new Error(
              `[GenImgAPI] Credenciales de Hive no configuradas para ${serviceInfo.name}.`
            );
          }
          const challengeString = "ImageSigningChallenge";
          const challengeBuffer = Buffer.from(challengeString);
          const combinedBuffer = Buffer.concat([challengeBuffer, imgBuffer]);
          const messageHashToSign = crypto
            .createHash("sha256")
            .update(combinedBuffer)
            .digest();
          const postingKey = PrivateKey.fromString(HIVE_UPLOAD_POSTING_KEY);
          const signature = postingKey.sign(messageHashToSign).toString();
          const uploadUrl = `${serviceInfo.url}${HIVE_UPLOAD_ACCOUNT_NAME}/${signature}`;

          const formData = new FormData();
          const blob = new Blob([imgBuffer], {
            type: imgMimeType || undefined,
          });
          formData.append("file", blob, fileName);

          const response = await fetch(uploadUrl, {
            method: "POST",
            body: formData,
          });
          if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
              `[GenImgAPI] Error subiendo a ${serviceInfo.name} (HTTP ${response.status}): ${errorBody}`
            );
          }
          const result = await response.json();
          const imgUrl =
            result.url ||
            result.imageUrl ||
            (typeof result === "string" ? result : null);
          if (!imgUrl)
            throw new Error(
              `[GenImgAPI] Respuesta inesperada de ${serviceInfo.name}`
            );
          return { imageUrl: imgUrl };
        }
      } else if (serviceInfo.name === "Cloudinary") {
        if (!cloudinary.config().cloud_name) {
          throw new Error("[GenImgAPI] Cloudinary SDK no configurado.");
        }
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: "image", public_id: fileName.split(".")[0] },
            (error, result) => {
              if (error) return reject(error);
              if (result)
                return resolve({
                  imageUrl: result.secure_url,
                  serviceMetadata: {
                    public_id: result.public_id,
                    version: result.version,
                  },
                });
              reject(
                new Error("[GenImgAPI] Resultado inesperado de Cloudinary")
              );
            }
          );
          uploadStream.end(imgBuffer);
        });
      }
      throw new Error(`[GenImgAPI] Servicio no soportado: ${serviceInfo.name}`);
    }

    try {
      const uploadResult = await uploadBufferToStorageService(
        buffer,
        randomFileName,
        mimeType,
        storageServiceInfo
      );
      uploadedImageUrl = uploadResult.imageUrl;
      uploadedServiceMetadata = uploadResult.serviceMetadata;
    } catch (uploadError: any) {
      console.warn(
        `[GenImgAPI] Falló subida a ${storageServiceInfo.name}: ${uploadError.message}. Intentando fallback.`
      );
      if (
        storageServiceInfo.type === "primary" &&
        storageServiceInfo.name !== "Cloudinary"
      ) {
        storageServiceInfo = { type: "fallback", name: "Cloudinary" };
        const fallbackResult = await uploadBufferToStorageService(
          buffer,
          randomFileName,
          mimeType,
          storageServiceInfo
        );
        uploadedImageUrl = fallbackResult.imageUrl;
        uploadedServiceMetadata = fallbackResult.serviceMetadata;
      } else {
        throw uploadError;
      }
    }

    // Guardar en la base de datos
    const supabase = createSupabaseServiceRoleClient();
    const { data: dbEntry, error: dbError } = await supabase
      .from("user_images")
      .insert({
        user_id: profileId,
        image_url: uploadedImageUrl,
        storage_service: storageServiceInfo.name,
        filename: randomFileName,
        size_bytes: buffer.length,
        mime_type: mimeType,
        metadata: uploadedServiceMetadata || {},
      })
      .select()
      .single();

    if (dbError) {
      console.error("[GenImgAPI] Error al guardar en BD:", dbError);
      // Considerar: si la subida al servicio fue exitosa pero falla la BD,
      // la imagen podría quedar huérfana.
      return NextResponse.json(
        {
          error: "Imagen subida, pero falló el registro en la base de datos.",
          details: dbError.message,
          imageUrl: uploadedImageUrl,
        },
        { status: 500 }
      );
    }

    console.log("[GenImgAPI] Imagen generada, subida y registrada:", dbEntry);
    return NextResponse.json({
      message: `Imagen generada y subida a ${storageServiceInfo.name}.`,
      imageUrl: uploadedImageUrl,
      uploadStatus: storageServiceInfo.name, // Indica dónde se subió
      usageMetadata: usageMetadata,
      dbData: dbEntry,
    });
  } catch (e: any) {
    // Este catch ahora es el principal para toda la lógica después de obtener el prompt.
    console.error(
      "Error en el proceso de generación o subida de imagen AI:",
      e
    );
    return NextResponse.json(
      { message: "Error generando o subiendo la imagen: " + e.message },
      { status: 500 }
    );
  }
}
