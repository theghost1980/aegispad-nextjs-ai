import {
  DeterminedStorageInfo,
  ImageServiceResponse,
  VerifiedServiceInfo,
} from "@/types/general.types";

let cachedStorageConfig: DeterminedStorageInfo | null = null;
let lastCheckTime: number = 0;
const CACHE_DURATION_MS = 10 * 60 * 1000;

const SERVICES_TO_CHECK: { name: string; url: string }[] = [
  { name: "Hive Images", url: "https://images.hive.blog/" },
  { name: "Ecency Images", url: "https://images.ecency.com/" },
];
const FALLBACK_SERVICE_NAME = "Cloudinary";
/**
 * Verifica si un servicio de imágenes está activo y responde con el formato esperado.
 * @param {string} url La URL base del servicio de imágenes.
 * @param {string} serviceName El nombre del servicio para los mensajes de log.
 * @returns {Promise<VerifiedServiceInfo | null>} Un objeto con información del servicio si es válido, o null.
 */
async function verificarServicio(
  url: string,
  serviceName: string
): Promise<VerifiedServiceInfo | null> {
  console.log(`[ImageStorageService] Verificando ${serviceName} en ${url}...`);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${url}?timestamp=${new Date().getTime()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        `[ImageStorageService] Respuesta no exitosa de ${serviceName} (HTTP ${response.status})`
      );
      return null;
    }

    const data: ImageServiceResponse = await response.json();

    if (
      data &&
      data.ok === true &&
      typeof data.version === "string" &&
      typeof data.date === "string"
    ) {
      console.log(
        `[ImageStorageService] ${serviceName} respondió correctamente. Versión: ${data.version}, Fecha: ${data.date}`
      );
      return { name: serviceName, url: url, data: data };
    } else {
      console.warn(
        `[ImageStorageService] Respuesta inesperada o formato no válido de ${serviceName}:`,
        data
      );
      return null;
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error(
        `[ImageStorageService] Timeout al contactar ${serviceName} (${url})`
      );
    } else {
      console.error(
        `[ImageStorageService] Error al contactar o procesar respuesta de ${serviceName} (${url}):`,
        error.message
      );
    }
    return null;
  }
}

/**
 * Determina el servicio de almacenamiento de imágenes primario, usando caché.
 * @returns {Promise<DeterminedStorageInfo>} Un objeto indicando el servicio primario o el de respaldo.
 */
export async function getDeterminedStorageService(): Promise<DeterminedStorageInfo> {
  const now = Date.now();
  if (cachedStorageConfig && now - lastCheckTime < CACHE_DURATION_MS) {
    console.log(
      "[ImageStorageService] Devolviendo configuración de almacenamiento cacheada:",
      cachedStorageConfig
    );
    return cachedStorageConfig;
  }

  console.log(
    "[ImageStorageService] Determinando o refrescando configuración de almacenamiento..."
  );

  for (const servicio of SERVICES_TO_CHECK) {
    const resultadoServicio = await verificarServicio(
      servicio.url,
      servicio.name
    );
    if (resultadoServicio) {
      cachedStorageConfig = {
        type: "primary",
        name: resultadoServicio.name,
        url: resultadoServicio.url,
      };
      lastCheckTime = now;
      console.log(
        `[ImageStorageService] Almacenamiento primario definido y cacheado: ${cachedStorageConfig.name} (${cachedStorageConfig.url})`
      );
      return cachedStorageConfig;
    }
  }

  console.log(
    "[ImageStorageService] Ninguno de los servicios preferidos respondió adecuadamente. Usando fallback."
  );
  cachedStorageConfig = {
    type: "fallback",
    name: FALLBACK_SERVICE_NAME,
    // Podrías añadir una URL base para Cloudinary si es fija y la necesitas aquí
    // url: "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/" (ejemplo)
  };
  lastCheckTime = now;
  return cachedStorageConfig;
}
