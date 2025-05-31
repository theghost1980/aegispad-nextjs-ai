# Guía Detallada: Subir Imágenes a Hive con Firma en Next.js

Este tutorial te guiará a través del proceso de implementación de un sistema de subida de imágenes a servicios compatibles con Hive (como `images.hive.blog` o `images.ecency.com/`) que requieren una firma criptográfica para autenticar la subida. Usaremos Next.js (App Router), TypeScript, y la librería `dhive`.

## Requisitos Previos

- Node.js (versión LTS recomendada)
- Un proyecto Next.js (puedes crear uno con `npx create-next-app@latest --typescript`)
- Una cuenta de Hive con su clave de posting privada.
- Variables de entorno configuradas para las credenciales.

## ¿Por qué se necesita una firma?

Los servicios de alojamiento de imágenes basados en Hive utilizan un mecanismo de firma para:

1.  **Autenticar al usuario:** Asegurar que la subida proviene de una cuenta de Hive válida.
2.  **Prevenir abusos:** Limitar la subida de imágenes a usuarios con cierta reputación o participación en la red.
3.  **Asociar la imagen (opcionalmente):** Aunque la firma principal es para la URL de subida, la imagen luego se usa en posts que sí se firman con la clave de posting para la blockchain.

El proceso de firma implica crear un hash único a partir de los datos de la imagen y una cadena de desafío, y luego firmar ese hash con la clave de posting privada del usuario. El servidor de imágenes puede entonces verificar esta firma usando la clave pública correspondiente.

## Paso 1: Instalación de Dependencias

Necesitaremos `dhive` para las operaciones criptográficas de Hive y `crypto` (que es un módulo nativo de Node.js, pero lo mencionamos para claridad).

```bash
npm install @hiveio/dhive
# O si usas yarn:
# yarn add @hiveio/dhive
```

## Paso 2: Configuración de Variables de Entorno

Crea un archivo `.env.local` en la raíz de tu proyecto Next.js y añade las siguientes variables. **Nunca subas este archivo a tu repositorio Git.**

```env
# .env.local

# Nombre de la cuenta de Hive que se usará para firmar las subidas
HIVE_UPLOAD_ACCOUNT_NAME="tu_nombre_de_usuario_hive"

# Clave de POSTING PRIVADA de la cuenta HIVE_UPLOAD_ACCOUNT_NAME
# ¡TRATAR CON EXTREMO CUIDADO!
POSTING_KEY="5K...tu_clave_de_posting_privada"
```

Asegúrate de reemplazar los valores de ejemplo con tus credenciales reales.

## Paso 3: Crear la API Route para la Subida de Imágenes

Crearemos un Route Handler en Next.js para manejar las peticiones de subida.

**Ubicación del archivo:** `src/app/api/images/upload/route.ts`

```typescript
// src/app/api/images/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrivateKey } from "@hiveio/dhive";
import crypto from "crypto";

// --- Constantes y Configuración ---
const HIVE_UPLOAD_ACCOUNT_NAME = process.env.HIVE_UPLOAD_ACCOUNT_NAME;
const HIVE_UPLOAD_POSTING_KEY = process.env.POSTING_KEY;

// URL base del servicio de imágenes de Hive (ajusta si usas otro como Ecency)
const HIVE_IMAGE_SERVICE_URL = "https://images.hive.blog/"; // O "https://images.ecency.com/"

/**
 * Sube una imagen a un servicio de imágenes de Hive.
 * @param imageBuffer Buffer de la imagen.
 * @param fileName Nombre del archivo.
 * @param mimeType Tipo MIME del archivo.
 * @returns Objeto con la URL de la imagen subida.
 */
async function uploadToHiveImageService(
  imageBuffer: Buffer,
  fileName: string,
  mimeType: string | null
): Promise<{ imageUrl: string; serviceMetadata?: any }> {
  if (!HIVE_UPLOAD_ACCOUNT_NAME || !HIVE_UPLOAD_POSTING_KEY) {
    throw new Error(
      "[UploadAPI] Credenciales de Hive (HIVE_UPLOAD_ACCOUNT_NAME, POSTING_KEY) no configuradas."
    );
  }

  console.log(
    `[UploadAPI] Intentando subir ${fileName} a ${HIVE_IMAGE_SERVICE_URL} usando la cuenta ${HIVE_UPLOAD_ACCOUNT_NAME}`
  );

  try {
    // 1. Crear el buffer de desafío y concatenarlo con el buffer de la imagen
    // La cadena "ImageSigningChallenge" es una constante usada por images.hive.blog
    const challengeString = "ImageSigningChallenge";
    const challengeBuffer = Buffer.from(challengeString);
    const combinedBuffer = Buffer.concat([challengeBuffer, imageBuffer]);

    // 2. Calcular el hash SHA256 del buffer concatenado
    // Este hash es el mensaje que se firmará.
    const messageHashToSign = crypto
      .createHash("sha256")
      .update(combinedBuffer)
      .digest();

    // 3. Firmar el hash con la clave de posting privada
    const postingKey = PrivateKey.fromString(HIVE_UPLOAD_POSTING_KEY);
    const signature = postingKey.sign(messageHashToSign).toString();

    // 4. Construir la URL de subida
    // El formato es: BASE_URL/USERNAME/SIGNATURE
    const uploadUrl = `${HIVE_IMAGE_SERVICE_URL}${HIVE_UPLOAD_ACCOUNT_NAME}/${signature}`;
    console.log(`[UploadAPI] URL de subida construida: ${uploadUrl}`);

    // 5. Preparar FormData con el archivo
    // El servidor de imágenes espera un POST multipart/form-data
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: mimeType || undefined });
    // El nombre del campo para el archivo suele ser 'file'
    formData.append("file", blob, fileName);

    // 6. Realizar la petición POST
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      // No es necesario establecer 'Content-Type': 'multipart/form-data' manualmente,
      // fetch lo hace automáticamente con el boundary correcto cuando el body es FormData.
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[UploadAPI] Error del servidor de imágenes (HTTP ${response.status}): ${errorBody}`
      );
      throw new Error(
        `Error subiendo a Hive Images (HTTP ${response.status}): ${errorBody}`
      );
    }

    // 7. Procesar la respuesta
    // Se espera un JSON con la URL de la imagen, ej: { "url": "https://images.hive.blog/..." }
    const result = await response.json();
    const imageUrl = result.url || result.imageUrl; // Ecency podría usar imageUrl

    if (!imageUrl) {
      console.error(
        "[UploadAPI] Respuesta inesperada del servidor de imágenes:",
        result
      );
      throw new Error(
        `Respuesta inesperada del servidor de imágenes: no se encontró URL en ${JSON.stringify(
          result
        )}`
      );
    }

    console.log(`[UploadAPI] Subida exitosa a Hive Images. URL: ${imageUrl}`);
    return { imageUrl: imageUrl };
  } catch (error) {
    console.error(`[UploadAPI] Falló la subida a Hive Images:`, error);
    // Re-lanzar el error para que sea manejado por el llamador
    throw error;
  }
}

// --- Route Handler Principal ---
export async function POST(request: NextRequest) {
  //Aca podria ir la parte de auth si se usa hive keychain, o una base de datos...

  if (request.method !== "POST") {
    return new NextResponse(null, {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  try {
    const formDataFromRequest = await request.formData();
    const imageFileEntry = formDataFromRequest.get("image"); // El campo del form se llama 'image'

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

    // Validar tamaño del archivo (ejemplo: máximo 10MB)
    const MAX_SIZE_MB = 10;
    if (imageFile.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `El archivo excede el tamaño máximo de ${MAX_SIZE_MB}MB.` },
        { status: 413 } // Payload Too Large
      );
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const originalFileName = imageFile.name || `uploaded_image_${Date.now()}`;
    const mimeType = imageFile.type;

    const { imageUrl, serviceMetadata } = await uploadToHiveImageService(
      imageBuffer,
      originalFileName,
      mimeType
    );

    // (Opcional) Guardar el proceso en una BD o generar un archivo json local en el servidor o un log usando winston

    return NextResponse.json(
      { message: "Imagen subida exitosamente", data: { imageUrl } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[UploadAPI] Error en el proceso de subida:", error);
    // Devolver un error genérico al cliente
    let errorMessage = "Error interno del servidor.";
    if (error.message.startsWith("Error subiendo a Hive Images")) {
      errorMessage = error.message; // Propagar el error específico del servicio de imágenes
    }
    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}
```

## Paso 4: Implementación en el Frontend

En tu componente de React (por ejemplo, una página de editor), necesitarás un input de tipo `file` y una función para manejar la subida.

**Ejemplo de componente de subida (simplificado):**
`src/components/ImageUploader.tsx` (deberás crearlo o integrarlo en tu página existente)

```tsx
// src/components/ImageUploader.tsx (Ejemplo)
"use client";

import { useState, ChangeEvent } from "react";

export function ImageUploader() {
  const [message, setMessage] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setMessage("Subiendo imagen...");
    setImageUrl(null);

    const formData = new FormData();
    formData.append("image", file); // El nombre del campo debe coincidir con el backend

    try {
      // Asume que tu API está en /api/images/upload
      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
        // No necesitas 'Content-Type' aquí, el navegador lo establece.
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Error en la subida");
      }

      setMessage(result.message);
      setImageUrl(result.data.imageUrl);
    } catch (error: any) {
      console.error("Error al subir la imagen:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      {isUploading && <p>Procesando...</p>}
      {message && <p>{message}</p>}
      {imageUrl && (
        <div>
          <p>Imagen subida:</p>
          <img
            src={imageUrl}
            alt="Imagen subida"
            style={{ maxWidth: "300px" }}
          />
          <p>URL: {imageUrl}</p>
        </div>
      )}
    </div>
  );
}
```

**Integración en una página:**
`src/app/my-editor-page/page.tsx` (Ejemplo)

```tsx
// src/app/my-editor-page/page.tsx
import { ImageUploader } from "@/components/ImageUploader"; // Ajusta la ruta

export default function MyEditorPage() {
  return (
    <div>
      <h1>Sube tu Imagen a Hive</h1>
      <ImageUploader />
      {/* Resto de tu editor */}
    </div>
  );
}
```

## Explicación Detallada del Proceso de Firma

La parte crucial es la función `uploadToHiveImageService` y, específicamente, cómo se genera la firma:

1.  **`challengeString = "ImageSigningChallenge";`**
    Esta es una cadena fija que el backend de `images.hive.blog` (y servicios similares) utiliza como parte del proceso de verificación de la firma. Es como una "sal" conocida por ambas partes.

2.  **`challengeBuffer = Buffer.from(challengeString);`**
    Se convierte la cadena de desafío a un `Buffer` de Node.js.

3.  **`combinedBuffer = Buffer.concat([challengeBuffer, imageBuffer]);`**
    Se crea un nuevo buffer concatenando el `challengeBuffer` con el `imageBuffer` (los bytes reales de la imagen que se va a subir). Este `combinedBuffer` es el dato único que representará esta subida específica.

4.  **`messageHashToSign = crypto.createHash("sha256").update(combinedBuffer).digest();`**

    - Se utiliza el módulo `crypto` de Node.js para crear un objeto hash SHA256.
    - `update(combinedBuffer)`: Se alimenta el buffer combinado al algoritmo hash.
    - `digest()`: Se calcula el hash final. El resultado es un `Buffer` de 32 bytes, que es la longitud estándar para un hash SHA256. **Este es el mensaje que realmente se firmará.**

5.  **`postingKey = PrivateKey.fromString(HIVE_UPLOAD_POSTING_KEY);`**
    Se instancia un objeto `PrivateKey` de `dhive` a partir de tu clave de posting privada (que obtuviste de `.env.local`).

6.  **`signature = postingKey.sign(messageHashToSign).toString();`**

    - `postingKey.sign(messageHashToSign)`: Se utiliza el método `sign` del objeto `PrivateKey` para firmar el `messageHashToSign`. `dhive` maneja la criptografía de curva elíptica (secp256k1) utilizada por Hive.
    - `.toString()`: La firma resultante (un objeto `Signature` de `dhive`) se convierte a su representación de cadena hexadecimal, que es lo que se enviará en la URL.

7.  **`uploadUrl = ${HIVE_IMAGE_SERVICE_URL}${HIVE_UPLOAD_ACCOUNT_NAME}/${signature};`**
    La URL final para la subida se construye concatenando la URL base del servicio de imágenes, el nombre de usuario de Hive que firma, y la firma generada. El servidor de imágenes recibirá esto, reconstruirá el hash de la misma manera (usando "ImageSigningChallenge" y los datos de la imagen recibida), y verificará la firma usando la clave pública del `HIVE_UPLOAD_ACCOUNT_NAME`. Si la verificación es exitosa, la imagen se procesa.

## Consideraciones Adicionales

- **Manejo de Errores:** El código de ejemplo incluye manejo básico de errores. En una aplicación de producción, querrás un manejo más robusto y mensajes de error más amigables para el usuario.
- **Límites de Tamaño:** Implementa validación del tamaño del archivo tanto en el frontend como en el backend.
- **Tipos de Archivo:** Valida los tipos de archivo permitidos (ej. `image/jpeg`, `image/png`, `image/gif`).
- **Seguridad de la Clave de Posting:** La clave de posting privada **nunca** debe exponerse al cliente. Toda la lógica de firma y subida debe residir en el backend (API Route).
- **Reputación de la Cuenta de Hive:** Algunos servicios de imágenes pueden requerir que la cuenta de Hive utilizada para firmar tenga una reputación mínima.
- **Servicios Múltiples (Hive Images, Ecency, Cloudinary):** El código que te proporcioné en interacciones anteriores (`utils/imageStorageService.ts`) muestra cómo determinar dinámicamente qué servicio usar, incluyendo un fallback a Cloudinary. Puedes integrar esa lógica aquí para mayor robustez.

Este tutorial te proporciona una base sólida para implementar la subida de imágenes firmadas a servicios de Hive. ¡Adapta y expande según las necesidades de tu proyecto!

## Esto lo comparto porque a pesar de que existen mucha documentacion a veces puede ser confusa

La idea es poder guiar a programadores que apenas llegan a HIVE.
