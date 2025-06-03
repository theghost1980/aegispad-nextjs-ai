interface VoiceControlServiceOptions {
  /** Callback para cuando se recibe una transcripción de voz. */
  onTranscript: (text: string, isFinal: boolean) => void;
  /** Callback para cuando se detecta un comando (funcionalidad futura). */
  //   onCommand?: (command: string) => void;
  /** Callback para errores del servicio de reconocimiento. */
  onError?: (
    errorEvent: SpeechRecognitionErrorEvent | { error: string; message: string }
  ) => void;
  /** Callback para cambios en el estado de escucha. */
  onStateChange?: (isListening: boolean) => void;
  /** Idioma para el reconocimiento (formato BCP 47, ej: 'en-US', 'es-ES'). */
  language?: string;
}

class VoiceControlService {
  private recognition: SpeechRecognition | null = null;
  private _isListening: boolean = false;
  private options: VoiceControlServiceOptions;
  private currentLanguage: string;

  constructor(options: VoiceControlServiceOptions) {
    this.options = options;
    // Intenta obtener el idioma del navegador o usa 'en-US' por defecto.
    // El idioma de la app (de next-intl) se puede pasar para mayor precisión.
    this.currentLanguage =
      options.language ||
      (typeof navigator !== "undefined" ? navigator.language : "en-US");

    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionAPI();
      this.setupRecognition();
    } else {
      console.warn(
        "Web Speech API (SpeechRecognition) no está soportada en este navegador."
      );
      if (this.options.onError) {
        this.options.onError({
          error: "not-supported",
          message: "API no soportada por el navegador.",
        });
      }
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    // true: sigue escuchando incluso después de una pausa del usuario.
    // Si es false, se detiene después de la primera frase/pausa.
    this.recognition.continuous = true;

    // true: devuelve resultados provisionales mientras el usuario habla.
    // false: solo devuelve el resultado final.
    this.recognition.interimResults = true;

    this.recognition.lang = this.currentLanguage;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Notificar solo si hay texto
      if (finalTranscript.trim()) {
        // Aquí podríamos añadir lógica para detectar si es un comando
        // if (this.options.onCommand && this.isCommand(finalTranscript.trim())) {
        //   this.options.onCommand(finalTranscript.trim());
        // } else {
        this.options.onTranscript(finalTranscript.trim(), true);
        // }
      }
      if (interimTranscript.trim()) {
        this.options.onTranscript(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error(
        "Error en reconocimiento de voz:",
        event.error,
        event.message
      );
      if (this.options.onError) {
        this.options.onError(event);
      }
      // Errores comunes:
      // 'no-speech': No se detectó voz.
      // 'audio-capture': Fallo al capturar audio (problema de micrófono).
      // 'not-allowed': Permiso denegado por el usuario o política de seguridad.
      // 'network': Algunos navegadores usan un servicio en la nube y puede haber error de red.
      this._isListening = false; // Asegurar que el estado se actualice
      if (this.options.onStateChange) {
        this.options.onStateChange(this._isListening);
      }
    };

    this.recognition.onstart = () => {
      console.log("Reconocimiento de voz iniciado.");
      this._isListening = true;
      if (this.options.onStateChange) {
        this.options.onStateChange(this._isListening);
      }
    };

    this.recognition.onend = () => {
      // Este evento se dispara cuando el reconocimiento se detiene, ya sea
      // manualmente con stop(), por un error, o porque 'continuous' es false.
      console.log("Reconocimiento de voz finalizado.");
      const wasListening = this._isListening;
      this._isListening = false;
      if (this.options.onStateChange) {
        this.options.onStateChange(this._isListening);
      }
      // Si 'continuous' es true, algunos navegadores intentan reiniciar automáticamente
      // si el final no fue por stop() o abort().
      // Si quisiéramos forzar un reinicio (con cuidado para evitar bucles):
      // if (wasListening && this.recognition && this.options.autoRestart) {
      //   this.recognition.start();
      // }
    };
  }

  public startListening(): void {
    if (this.recognition && !this._isListening) {
      try {
        // Asegurar que el idioma esté actualizado antes de iniciar
        this.recognition.lang = this.currentLanguage;
        this.recognition.start();
        // El evento 'onstart' se encargará de actualizar _isListening y notificar
      } catch (e: any) {
        console.error("Error al intentar iniciar reconocimiento:", e);
        if (this.options.onError) {
          this.options.onError({
            error: "start-failed",
            message: e.message || "No se pudo iniciar el reconocimiento.",
          });
        }
        this._isListening = false; // Asegurar estado correcto
        if (this.options.onStateChange) {
          this.options.onStateChange(this._isListening);
        }
      }
    }
  }

  public stopListening(): void {
    if (this.recognition && this._isListening) {
      this.recognition.stop();
      // El evento 'onend' se encargará de actualizar _isListening y notificar
    }
  }

  public toggleListening(): void {
    if (this._isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  public setLanguage(language: string): void {
    this.currentLanguage = language;
    if (this.recognition) {
      const wasListening = this._isListening;
      if (wasListening) {
        this.recognition.stop(); // Detener para aplicar el cambio de idioma
      }
      this.recognition.lang = this.currentLanguage;
      // Si estaba escuchando, podría ser necesario reiniciar manualmente
      // o informar al usuario que debe volver a activar.
      // Por ahora, si estaba escuchando, se detendrá. El usuario deberá reactivar.
      // if (wasListening) {
      //   setTimeout(() => this.startListening(), 100); // Pequeña demora para asegurar que stop() complete
      // }
    }
  }

  public getIsListening(): boolean {
    return this._isListening;
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }
}

export default VoiceControlService;
