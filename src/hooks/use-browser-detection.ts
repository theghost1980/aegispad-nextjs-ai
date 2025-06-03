"use client";

import { useEffect, useState } from "react";

interface BrowserInfo {
  isChrome: boolean;
  isBrave: boolean;
}

export function useBrowserDetection(): BrowserInfo {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo>({
    isChrome: false, // Default to false until checked
    isBrave: false, // Default to false until checked
  });

  useEffect(() => {
    // Asegurar que se ejecuta solo en el cliente
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      const ua = navigator.userAgent;
      const vendor = navigator.vendor;

      // Detección de Brave: la presencia de navigator.brave es un fuerte indicador síncrono.
      // La función navigator.brave.isBrave() es asíncrona y más precisa,
      // pero para una detección síncrona inicial en el montaje, esto es un buen comienzo.
      const detectedBrave = typeof (navigator as any).brave !== "undefined";

      // Detección de Chrome:
      // - Debe tener "Chrome/" en el user agent.
      // - El vendor debe ser "Google Inc.".
      // - No debe ser Brave (incluso si Brave usa "Chrome/" en su UA).
      // - No debe ser Edge Chromium (que también tiene "Chrome/" pero "Edg/").
      // - No debe ser Opera (que también tiene "Chrome/" pero "OPR/").
      const detectedChrome =
        !detectedBrave && // Importante: excluir Brave primero
        /Chrome\/[0-9.]+/.test(ua) && // Check for "Chrome/"
        !!vendor &&
        vendor.toLowerCase().includes("google inc.") &&
        !/Edg\/[0-9.]+/.test(ua) && // Excluir Edge
        !/OPR\/[0-9.]+/.test(ua); // Excluir Opera

      setBrowserInfo({
        isChrome: detectedChrome,
        isBrave: detectedBrave,
      });
    }
  }, []); // Se ejecuta una vez después del montaje

  return browserInfo;
}
