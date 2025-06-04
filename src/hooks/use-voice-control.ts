"use client"; // Los hooks con estado y efectos secundarios que interactúan con APIs del navegador deben ser client components

import { VoiceCommand } from "@/constants/constants"; // Importar la nueva interfaz
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
  currentLanguage: string; // Expose the current language
  interimTranscript: string;
  finalTranscript: string;
  // Podríamos exponer la transcripción directamente si el hook la gestionara,
  // pero dado que el componente padre ya la recibe vía onTranscript,
  // puede que no sea necesario duplicarla aquí.
  // currentTranscript: { interim: string; final: string };
}

export function useVoiceControl({
  onTranscript,
  initialLanguage,
  onCommand,
  commands = [], // Cambiado el valor por defecto a un array vacío
  showInterimResults = true,
}: UseVoiceControlOptions): UseVoiceControlReturn {
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [finalTranscript, setFinalTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true); // Asumir soportado hasta que se compruebe
  const [error, setError] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string>(
    initialLanguage || navigator.language || "en-US"
  ); // State for current language

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

  useEffect(() => {
    // Solo inicializar en el cliente
    if (typeof window === "undefined") {
      setIsSupported(false); // No soportado en SSR
      return;
    }

    // Ensure the service is created only once or when initialLanguage/commands change significantly
    if (voiceServiceRef.current) {
      // If service already exists, just update its language if needed
      const newLang = initialLanguage || navigator.language || "en-US";
      if (currentLanguage !== newLang) {
        // Usar el estado currentLanguage del hook
        voiceServiceRef.current.setLanguage(newLang);
        setCurrentLanguage(newLang); // Update state when language is set
      }
      // No need to recreate the service just for callback changes, refs handle that.
      return;
    }

    console.log(
      "[useVoiceControl] Initializing VoiceControlService with language:",
      initialLanguage || navigator.language || "en-US"
    );
    const serviceOptions: VoiceServiceOptions = {
      onTranscript: (text, isFinal) => {
        if (isFinal) {
          console.log("[useVoiceControl] Received FINAL transcript:", text);
          setInterimTranscript(""); // Limpiar interina en cuanto llega un resultado final
          setFinalTranscript((prev) => prev + text + " "); // Actualizar transcripción final local

          const normalizedText = normalizeTextForCommand(text);
          let commandAction: string | undefined = undefined;

          // Iterar sobre la nueva estructura de comandos
          for (const cmd of commands) {
            if (cmd.keywords.includes(normalizedText)) {
              commandAction = cmd.action;
              break;
            }
          }
          if (commandAction && onCommandRef.current) {
            onCommandRef.current(commandAction);
          } else if (onTranscriptRef.current) {
            // No es un comando, pasarlo al onTranscript del consumidor
            onTranscriptRef.current?.(text, isFinal);
          }
        } else {
          console.log("[useVoiceControl] Received INTERIM transcript:", text);
          // Resultado interino
          if (showInterimResults) {
            setInterimTranscript(text);
          }
          // No llamar a onTranscriptRef.current(text, false) aquí, ya se maneja arriba si es final
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
      language: initialLanguage || navigator.language || "en-US",
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
    setCurrentLanguage(language); // Update state immediately
    console.log("[useVoiceControl] Setting language to:", language);
    voiceServiceRef.current?.setLanguage(language);
    setIsListening(false); // Asumir que se detiene al cambiar idioma
    setInterimTranscript(""); // Limpiar transcripciones
    setFinalTranscript("");
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
