import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

/**
 * Sube una imagen en formato base64 a Cloudinary.
 * @param base64Data - La imagen en formato base64 (puede incluir el prefijo data:image/...).
 * @returns Una promesa que resuelve con la URL segura de la imagen subida.
 * @throws Error si la subida falla o si las credenciales no están configuradas.
 */
export async function uploadBase64ToCloudinary(
  base64Data: string
): Promise<string> {
  if (
    !process.env.CLOUD_NAME ||
    !process.env.API_KEY ||
    !process.env.API_SECRET
  ) {
    console.error(
      "Cloudinary credentials are not fully configured in environment variables."
    );
    throw new Error("Cloudinary credentials are not configured.");
  }

  if (!base64Data) {
    throw new Error("No base64 data provided for upload.");
  }

  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: "aegispad-uploads",
      resource_type: "image",
      tags: ["aegispad", "ai-generated"],
    });

    if (!result || !result.secure_url) {
      console.error("Cloudinary upload result missing secure_url:", result);
      throw new Error(
        "Cloudinary upload failed: Missing secure URL in response."
      );
    }

    return result.secure_url;
  } catch (error: any) {
    console.error("Error uploading image to Cloudinary:", error);
    throw new Error(
      `Failed to upload image to Cloudinary: ${
        error.message || "Unknown error"
      }`
    );
  }
}
