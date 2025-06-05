interface VoiceControlServiceOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (
    errorEvent: SpeechRecognitionErrorEvent | { error: string; message: string }
  ) => void;
  onStateChange?: (isListening: boolean) => void;
  language?: string;
}

class VoiceControlService {
  private recognition: SpeechRecognition | null = null;
  private _isListening: boolean = false;
  private options: VoiceControlServiceOptions;
  private currentLanguage: string;

  constructor(options: VoiceControlServiceOptions) {
    this.options = options;
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

    this.recognition.continuous = true;
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

      if (finalTranscript.trim()) {
        this.options.onTranscript(finalTranscript.trim(), true);
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
      this._isListening = false;
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
      console.log("Reconocimiento de voz finalizado.");
      const wasListening = this._isListening;
      this._isListening = false;
      if (this.options.onStateChange) {
        this.options.onStateChange(this._isListening);
      }
    };
  }

  public startListening(): void {
    if (this.recognition && !this._isListening) {
      try {
        console.log(
          `[VoiceControlService] Attempting to start recognition. Service currentLanguage: ${this.currentLanguage}. Recognition object lang will be set to: ${this.currentLanguage}`
        );
        this.recognition.lang = this.currentLanguage;
        this.recognition.start();
      } catch (e: any) {
        console.error("Error al intentar iniciar reconocimiento:", e);
        if (this.options.onError) {
          this.options.onError({
            error: "start-failed",
            message: e.message || "No se pudo iniciar el reconocimiento.",
          });
        }
        this._isListening = false;
        if (this.options.onStateChange) {
          this.options.onStateChange(this._isListening);
        }
      }
    }
  }

  public stopListening(): void {
    if (this.recognition && this._isListening) {
      this.recognition.stop();
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
    }
  }

  public getLanguage(): string {
    return this.currentLanguage;
  }

  public getIsListening(): boolean {
    return this._isListening;
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }
}

export default VoiceControlService;
