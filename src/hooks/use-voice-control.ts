"use client"; // Los hooks con estado y efectos secundarios que interactúan con APIs del navegador deben ser client components

import { VoiceCommand } from "@/constants/constants"; // Importar la nueva interfaz
import { defaultLocale } from "@/i18n/config"; // Importar el defaultLocale
import VoiceControlService from "@/lib/web-speech-api/voice-control-service"; // Ajusta la ruta si es necesario
import { useCallback, useEffect, useRef, useState } from "react";

interface UseVoiceControlOptions {
  /** Callback que se ejecuta cuando se recibe texto transcrito. */
  onTranscript: (text: string, isFinal: boolean) => void;
  /** Idioma inicial para el reconocimiento (formato BCP 47, ej: 'en-US', 'es-ES'). */
  initialLanguage?: string;
  /** Callback para cuando se detecta un comando (funcionalidad futura). */
  onCommand?: (command: string) => void;
  commands?: VoiceCommand[]; // Cambiado de Record<string, string> a VoiceCommand[]
  showInterimResults?: boolean;
}

interface VoiceServiceOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError: (errorEvent: any) => void;
  onStateChange: (listeningState: boolean) => void;
  language: string;
}

interface UseVoiceControlReturn {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  setLanguage: (language: string) => void;
  currentLanguage: string;
  interimTranscript: string;
  finalTranscript: string;
}

export function useVoiceControl({
  onTranscript,
  initialLanguage,
  onCommand,
  commands = [],
  showInterimResults = true,
}: UseVoiceControlOptions): UseVoiceControlReturn {
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [finalTranscript, setFinalTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    const lang = initialLanguage?.trim()
      ? initialLanguage
      : typeof navigator !== "undefined"
      ? navigator.language
      : "en-US";
    const fallbackLang = lang?.trim() ? lang : "en-US";
    console.log(
      `[useVoiceControl] Initial currentLanguage state set to: ${fallbackLang} (from initialLanguage: ${initialLanguage}, navigator.language: ${
        typeof navigator !== "undefined" ? navigator.language : "N/A"
      })`
    );
    return fallbackLang;
  });

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

  const interimTranscriptRef = useRef(interimTranscript);
  const finalTranscriptRef = useRef(finalTranscript);

  useEffect(() => {
    interimTranscriptRef.current = interimTranscript;
    finalTranscriptRef.current = finalTranscript;
  }, [interimTranscript, finalTranscript]);

  const setLanguage = useCallback((language: string) => {
    if (!language || language.trim() === "") {
      console.warn(
        `[useVoiceControl] Attempted to set an empty or invalid language. Received: "${language}". Ignoring.`
      );
      return;
    }
    setCurrentLanguage(language);
    console.log("[useVoiceControl] Setting language to:", language);
    if (voiceServiceRef.current) {
      voiceServiceRef.current.setLanguage(language);
      setIsListening(false);
      setInterimTranscript("");
      setFinalTranscript("");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsSupported(false);
      return;
    }

    if (voiceServiceRef.current) {
      if (voiceServiceRef.current.getLanguage() !== currentLanguage) {
        voiceServiceRef.current.setLanguage(currentLanguage);
      }
      return;
    }

    console.log(
      "[useVoiceControl] Initializing VoiceControlService with language:",
      currentLanguage
    );
    const serviceOptions: VoiceServiceOptions = {
      onTranscript: (text, isFinal) => {
        if (isFinal) {
          console.log("[useVoiceControl] Received FINAL transcript:", text);
          setInterimTranscript("");
          setFinalTranscript((prev) => prev + text + " ");

          const normalizedText = normalizeTextForCommand(text);
          let commandAction: string | undefined = undefined;
          const baseLang = currentLanguage.split("-")[0];

          for (const cmd of commands) {
            const langKeywords =
              cmd.keywords[currentLanguage] ||
              cmd.keywords[baseLang] ||
              cmd.keywords[defaultLocale] ||
              cmd.keywords["en-US"] ||
              cmd.keywords["en"];

            if (langKeywords && langKeywords.includes(normalizedText)) {
              commandAction = cmd.action;
              break;
            }
          }
          if (commandAction && onCommandRef.current) {
            onCommandRef.current(commandAction);
          } else if (onTranscriptRef.current) {
            onTranscriptRef.current?.(text, isFinal);
          }
        } else {
          console.log("[useVoiceControl] Received INTERIM transcript:", text);
          if (showInterimResults) {
            setInterimTranscript(text);
          }
        }
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
        setInterimTranscript(""); // Limpiar transcripción interina en error
        setFinalTranscript(""); // Considerar limpiar también la final o mantenerla para depuración
      },
      onStateChange: (listeningState) => {
        setIsListening(listeningState);
        if (listeningState) {
          setError(null); // Limpiar errores cuando comienza a escuchar
          setInterimTranscript(""); // Limpiar transcripciones al iniciar nueva escucha
          setFinalTranscript("");
        }
      },
      language: currentLanguage, // Use the state which has a safe fallback
    };

    const service = new VoiceControlService(serviceOptions);
    voiceServiceRef.current = service;
    setIsSupported(service.isSupported());
    if (!service.isSupported()) {
      setError("El reconocimiento de voz no es compatible con este navegador.");
    }

    return () => {
      voiceServiceRef.current?.stopListening();
    };
  }, [commands, currentLanguage, showInterimResults]);

  useEffect(() => {
    console.log(
      `[useVoiceControl] Effect for initialLanguage change. initialLanguage prop: ${initialLanguage}, currentLanguage state: ${currentLanguage}`
    );
    if (
      initialLanguage &&
      initialLanguage.trim() !== "" &&
      initialLanguage !== currentLanguage
    ) {
      console.log(
        `[useVoiceControl] initialLanguage prop (${initialLanguage}) is different from currentLanguage state (${currentLanguage}). Calling setLanguage.`
      );
      setLanguage(initialLanguage);
    } else {
      console.log(
        `[useVoiceControl] initialLanguage prop (${initialLanguage}) is NOT different or invalid compared to currentLanguage state (${currentLanguage}). Not calling setLanguage.`
      );
    }
  }, [initialLanguage, currentLanguage, setLanguage]);

  const startListening = useCallback(() => {
    if (voiceServiceRef.current?.isSupported()) {
      voiceServiceRef.current.startListening();
    } else if (voiceServiceRef.current) {
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

  return {
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    toggleListening,
    setLanguage,
    currentLanguage,
    interimTranscript,
    finalTranscript,
  };
}
