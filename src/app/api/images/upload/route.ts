import { NextRequest, NextResponse } from "next/server";

import { getProfileIdFromAuth } from "@/lib/auth/server.utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { DeterminedStorageInfo } from "@/types/general.types";
import { getDeterminedStorageService } from "@/utils/imageStorageService";
import { PrivateKey } from "@hiveio/dhive";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";

const HIVE_UPLOAD_ACCOUNT_NAME =
  process.env.NEXT_PUBLIC_HIVE_UPLOAD_ACCOUNT_NAME;
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

async function uploadToActualService(
  imageBuffer: Buffer,
  fileName: string,
  mimeType: string | null,
  serviceInfo: DeterminedStorageInfo
): Promise<{ imageUrl: string; serviceMetadata?: any }> {
  console.log(
    `[UploadAPI] Intentando subir ${fileName} a ${serviceInfo.name} (${
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
          `[UploadAPI] Credenciales de Hive (HIVE_UPLOAD_ACCOUNT_NAME, HIVE_UPLOAD_POSTING_KEY/MEMO_KEY) no configuradas para ${serviceInfo.name}.`
        );
      }

      try {
        const challengeString = "ImageSigningChallenge";
        const challengeBuffer = Buffer.from(challengeString);
        const combinedBuffer = Buffer.concat([challengeBuffer, imageBuffer]);

        const messageHashToSign = crypto
          .createHash("sha256")
          .update(combinedBuffer)
          .digest();
        const postingKey = PrivateKey.fromString(HIVE_UPLOAD_POSTING_KEY);
        const signature = postingKey.sign(messageHashToSign).toString();

        const uploadUrl = `${serviceInfo.url}${HIVE_UPLOAD_ACCOUNT_NAME}/${signature}`;
        console.log(
          `[UploadAPI] Intentando subir a ${serviceInfo.name} en ${uploadUrl}`
        );

        const formData = new FormData();
        const blob = new Blob([imageBuffer], { type: mimeType || undefined });
        formData.append("file", blob, fileName);

        const response = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `[UploadAPI] Error subiendo a ${serviceInfo.name} (HTTP ${response.status}): ${errorBody}`
          );
        }

        const result = await response.json();
        const imageUrl =
          result.url ||
          result.imageUrl ||
          (typeof result === "string" ? result : null);

        if (!imageUrl) {
          throw new Error(
            `[UploadAPI] Respuesta inesperada de ${
              serviceInfo.name
            }: no se encontró URL en ${JSON.stringify(result)}`
          );
        }
        console.log(
          `[UploadAPI] Subida exitosa a ${serviceInfo.name}. URL: ${imageUrl}`
        );
        return { imageUrl: imageUrl };
      } catch (error) {
        console.error(
          `[UploadAPI] Falló la subida a ${serviceInfo.name}:`,
          error
        );
        throw error;
      }
    }
  } else if (serviceInfo.name === "Cloudinary") {
    if (!cloudinary.config().cloud_name) {
      throw new Error(
        "[UploadAPI] Cloudinary SDK no está configurado. Verifica las variables de entorno (NEXT_PUBLIC_CLOUD_NAME, API_KEY, API_SECRET)."
      );
    }
    console.log(`[UploadAPI] Intentando subir ${fileName} a Cloudinary...`);
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "image", public_id: fileName.split(".")[0] },
        (error, result) => {
          if (error) {
            console.error("[UploadAPI] Falló la subida a Cloudinary:", error);
            return reject(error);
          }
          if (result) {
            console.log(
              `[UploadAPI] Subida exitosa a Cloudinary. URL: ${result.secure_url}`
            );
            return resolve({
              imageUrl: result.secure_url,
              serviceMetadata: {
                public_id: result.public_id,
                version: result.version,
              },
            });
          }
          return reject(
            new Error(
              "[UploadAPI] Resultado inesperado de Cloudinary sin error ni resultado."
            )
          );
        }
      );
      uploadStream.end(imageBuffer);
    });
  }

  throw new Error(
    `Servicio de almacenamiento no soportado o no configurado para la subida: ${serviceInfo.name}`
  );
}

export async function POST(request: NextRequest) {
  if (request.method !== "POST") {
    return new NextResponse(null, {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  const profileId = await getProfileIdFromAuth(request);
  if (!profileId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = profileId;

  try {
    const formDataFromRequest = await request.formData();
    const imageFileEntry = formDataFromRequest.get("image");

    if (!imageFileEntry || !(imageFileEntry instanceof File)) {
      return NextResponse.json(
        {
          error:
            'No se proporcionó ningún archivo de imagen válido en el campo "image".',
        },
        { status: 400 }
      );
    }
    const imageFile = imageFileEntry as File;

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const originalFileName = imageFile.name || `uploaded_image_${Date.now()}`;
    const mimeType = imageFile.type;
    const sizeBytes = imageFile.size;

    let storageServiceInfo = await getDeterminedStorageService();
    let imageUrl: string;
    let serviceMetadata: any;

    try {
      const uploadResult = await uploadToActualService(
        imageBuffer,
        originalFileName,
        mimeType,
        storageServiceInfo
      );
      imageUrl = uploadResult.imageUrl;
      serviceMetadata = uploadResult.serviceMetadata;
    } catch (uploadError: any) {
      console.warn(
        `[UploadAPI] Falló la subida al servicio ${storageServiceInfo.name}: ${uploadError.message}. Intentando fallback si es aplicable.`
      );
      if (
        storageServiceInfo.type === "primary" &&
        storageServiceInfo.name !== "Cloudinary"
      ) {
        console.log(
          "[UploadAPI] Intentando subir a Cloudinary como fallback..."
        );
        storageServiceInfo = { type: "fallback", name: "Cloudinary" };
        const fallbackUploadResult = await uploadToActualService(
          imageBuffer,
          originalFileName,
          mimeType,
          storageServiceInfo
        );
        imageUrl = fallbackUploadResult.imageUrl;
        serviceMetadata = fallbackUploadResult.serviceMetadata;
      } else {
        throw uploadError;
      }
    }

    const supabase = createSupabaseServiceRoleClient();
    const { data: dbEntry, error: dbError } = await supabase
      .from("user_images")
      .insert({
        user_id: userId,
        image_url: imageUrl,
        storage_service: storageServiceInfo.name,
        filename: originalFileName,
        size_bytes: sizeBytes,
        mime_type: mimeType,
        metadata: serviceMetadata || {},
      })
      .select()
      .single();

    if (dbError) {
      console.error("[UploadAPI] Error al guardar en BD:", dbError);
      return NextResponse.json(
        {
          error: "Error al guardar la información de la imagen.",
          details: dbError.message,
        },
        { status: 500 }
      );
    }

    console.log("[UploadAPI] Imagen subida y registrada:", dbEntry);
    return NextResponse.json(
      { message: "Imagen subida exitosamente", data: dbEntry },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[UploadAPI] Error en el proceso de subida:", error);
    return NextResponse.json(
      { error: "Error interno del servidor.", details: error.message },
      { status: 500 }
    );
  }
}
