"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog, { PostHogConfig } from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { Suspense, useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "/ingest"; // Default to /ingest if not set

    if (posthogKey) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        loaded: function (posthog) {
          if (process.env.NODE_ENV === "development") {
            // Opción 1: Desactivar solo en desarrollo
            posthog.opt_out_capturing();
            console.log(
              "PostHog capturing disabled in development environment."
            );
          }
          posthog.opt_out_capturing(); //TODO enable when ready to tests with users!
        },
        ui_host: "https://us.posthog.com", // Or your self-hosted UI if applicable
        capture_pageview: false, // We capture pageviews manually
        capture_pageleave: true, // Enable pageleave capture

        // --- Configuraciones clave para reducir eventos ---

        // 1. Deshabilitar la Grabación de Sesiones Completamente
        // Esto es lo que necesitas para detener los eventos "$snapshot".
        disable_session_recording: true, // @default false

        // 2. Deshabilitar la Captura Automática de Interacciones (clicks, cambios de input, etc.)
        // Esto es fundamental para reducir la mayoría de los eventos de "heatmap" y otros como "$autocapture".
        autocapture: false, // @default true

        // 3. Deshabilitar la Captura de "Rage Clicks"
        // Los rage clicks son un tipo específico de interacción que PostHog detecta.
        // Aunque "autocapture: false" debería cubrirlo, especificarlo no está de más.
        rageclick: false, // @default true

        // 4. Deshabilitar la Captura de Métricas Web Vitals
        // Esto detendrá los eventos como "$web_vitals".
        performance_capture: {
          // Este es un objeto de configuración para métricas de rendimiento.
          web_vitals: false, // @default true (si 'performance_capture' está activo o no configurado explícitamente)
        },

        // 5. Deshabilitar la Detección de Dead Clicks
        // Esto previene eventos "$dead_click".
        dead_clicks: {
          __onCapture: undefined, // Al no proveer una función de captura, esencialmente lo deshabilita.
          // La definición `dead_clicks` no tiene un 'enabled' directo,
          // pero el comportamiento por defecto es auto-capturar si no se provee __onCapture.
        },
        // Nota: Aunque `dead_clicks` no está explícitamente en la lista principal de `PostHogConfig` que proporcionaste,
        // es una funcionalidad común y la forma de deshabilitarla, si está activa, es a través de este objeto.
        // Si no está causando ruido, puedes omitirlo.

        // 6. Deshabilitar la Captura de Excepciones Automáticas (errores)
        // Para detener eventos como "$exception".
        exception_autocapture: {
          capture_unhandled_errors: false, // @default true
          capture_unhandled_rejections: false, // @default true
          capture_console_errors: false, // @default false
        },

        // 7. Deshabilitar la carga de dependencias externas
        // Esto evita que PostHog cargue scripts adicionales para Session Replay, Encuestas, etc.
        disable_external_dependency_loading: true, // @default false

        // 8. Deshabilitar las Encuestas
        // Si no usas las encuestas, esto evita su lógica de carga y visualización.
        disable_surveys: true, // @default false

        // 9. Deshabilitar los Experimentos Web
        // Si no usas esta característica.
        disable_web_experiments: true, // @default true (actualmente en BETA)

        // --- Otras configuraciones importantes ---

        debug: process.env.NODE_ENV === "development",
      } as Partial<PostHogConfig>);
    } else {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "PostHog key (NEXT_PUBLIC_POSTHOG_KEY) not found. PostHog will not be initialized."
        );
      }
    }
  }, []);
  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  );
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      const search = searchParams.toString();
      if (search) {
        url += "?" + search;
      }
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, posthog]);

  return null;
}

function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  );
}
