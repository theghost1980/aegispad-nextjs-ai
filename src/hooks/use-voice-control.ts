"use client"; // Los hooks con estado y efectos secundarios que interactúan con APIs del navegador deben ser client components

import VoiceControlService from "@/lib/web-speech-api/voice-control-service"; // Ajusta la ruta si es necesario
import { useCallback, useEffect, useRef, useState } from "react";

interface UseVoiceControlOptions {
  /** Callback que se ejecuta cuando se recibe texto transcrito. */
  onTranscript: (text: string, isFinal: boolean) => void;
  /** Idioma inicial para el reconocimiento (formato BCP 47, ej: 'en-US', 'es-ES'). */
  initialLanguage?: string;
  /** Callback para cuando se detecta un comando (funcionalidad futura). */
  onCommand?: (command: string) => void;
  commands?: Record<string, string>;
}

interface UseVoiceControlReturn {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  setLanguage: (language: string) => void;
  // Podríamos exponer la transcripción directamente si el hook la gestionara,
  // pero dado que el componente padre ya la recibe vía onTranscript,
  // puede que no sea necesario duplicarla aquí.
  // currentTranscript: { interim: string; final: string };
}

export function useVoiceControl({
  onTranscript,
  initialLanguage,
  onCommand,
  commands = {},
}: UseVoiceControlOptions): UseVoiceControlReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true); // Asumir soportado hasta que se compruebe
  const [error, setError] = useState<string | null>(null);

  const voiceServiceRef = useRef<VoiceControlService | null>(null);

  const normalizeTextForCommand = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[.,!?]$/, "");
  };

  const onTranscriptRef = useRef(onTranscript);
  const onCommandRef = useRef(onCommand);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onCommandRef.current = onCommand;
  }, [onTranscript, onCommand]);

  useEffect(() => {
    // Solo inicializar en el cliente
    if (typeof window === "undefined") {
      setIsSupported(false); // No soportado en SSR
      return;
    }

    const service = new VoiceControlService({
      onTranscript: (text, isFinal) => {
        // Esta es la transcripción cruda del VoiceControlService
        if (
          isFinal &&
          onCommandRef.current &&
          Object.keys(commands).length > 0
        ) {
          const normalizedText = normalizeTextForCommand(text);
          const commandAction = commands[normalizedText];

          if (commandAction) {
            onCommandRef.current(commandAction); // Es un comando, notificar al componente padre
            return; // No procesar como transcripción normal
          }
        }
        // Si no es un comando, o no es final, o no hay onCommand handler, pasar como transcripción
        onTranscriptRef.current(text, isFinal);
      },
      onError: (errorEvent) => {
        console.error("Voice Service Error (from hook):", errorEvent);
        let msg = "Error desconocido en el reconocimiento de voz.";
        const errorDetail =
          "error" in errorEvent
            ? errorEvent.error
            : (errorEvent as { message: string }).message;
        const messageDetail = "message" in errorEvent ? errorEvent.message : "";

        if (errorDetail === "not-supported") {
          msg = "El reconocimiento de voz no es compatible con este navegador.";
          setIsSupported(false);
        } else if (errorDetail === "not-allowed") {
          msg =
            "Permiso para micrófono denegado. Habilítalo en la configuración del navegador.";
        } else if (errorDetail === "no-speech") {
          msg = "No se detectó voz. Intenta de nuevo.";
        } else if (errorDetail === "network") {
          msg = "Error de red con el servicio de reconocimiento.";
        } else if (errorDetail === "audio-capture") {
          msg = "Error al capturar audio. Verifica tu micrófono.";
        } else if (errorDetail === "start-failed" || messageDetail) {
          msg = messageDetail || "No se pudo iniciar el reconocimiento.";
        }
        setError(msg);
        setIsListening(false);
      },
      onStateChange: (listeningState) => {
        setIsListening(listeningState);
        if (listeningState) {
          setError(null); // Limpiar errores cuando comienza a escuchar
        }
      },
      language: initialLanguage || navigator.language || "en-US",
    });

    voiceServiceRef.current = service;
    setIsSupported(service.isSupported());
    if (!service.isSupported()) {
      setError("El reconocimiento de voz no es compatible con este navegador.");
    }

    return () => {
      voiceServiceRef.current?.stopListening();
    };
  }, [initialLanguage, commands]);

  const startListening = useCallback(() => {
    if (voiceServiceRef.current?.isSupported()) {
      voiceServiceRef.current.startListening();
    } else if (voiceServiceRef.current) {
      // Si no es soportado pero el servicio existe
      setError("El reconocimiento de voz no es compatible con este navegador.");
    }
  }, []);

  const stopListening = useCallback(() => {
    voiceServiceRef.current?.stopListening();
  }, []);

  const toggleListening = useCallback(() => {
    if (voiceServiceRef.current?.isSupported()) {
      voiceServiceRef.current.toggleListening();
    } else if (voiceServiceRef.current) {
      setError("El reconocimiento de voz no es compatible con este navegador.");
    }
  }, []);

  const setLanguage = useCallback((language: string) => {
    voiceServiceRef.current?.setLanguage(language);
    // Si estaba escuchando, el servicio se detendrá. El usuario podría necesitar reactivar.
    // Podrías querer actualizar el estado de isListening aquí si el servicio no lo hace automáticamente
    // a través de onStateChange al cambiar de idioma y detenerse.
  }, []);

  return {
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    toggleListening,
    setLanguage,
  };
}
