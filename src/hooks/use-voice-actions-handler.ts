import {
  PunctuationRule,
  VOICE_COMMANDS,
  VOICE_PUNCTUATION_MAP,
} from "@/constants/constants";
import { ActiveEditorAction, LanguageCode } from "@/types/general.types";
import { RefObject, useEffect, useState } from "react";
import { useVoiceControl } from "./use-voice-control";

// Tipos para el estado interno del manejador de voz
type VoiceActionState =
  | "idle"
  | "awaiting_prompt"
  | "awaiting_heading_title"
  | "awaiting_direct_dictation";

// Props que el hook necesitará desde el componente que lo usa (page.tsx)
export interface UseVoiceActionsHandlerProps {
  articleMarkdown: string;
  setArticleMarkdown: (markdown: string | ((prev: string) => string)) => void;
  mainTextareaRef: RefObject<HTMLTextAreaElement>;
  handleStartArticleFromPanel: (promptText: string) => void;
  setActiveAction: (action: ActiveEditorAction) => void; // Add setActiveAction here
  initialSpeechLanguage: string;
  onToggleHelp: () => void; // Callback to toggle help display
  // Podríamos necesitar 't' para mensajes si el hook genera alguno,
  // pero idealmente los toasts los manejan las funciones de acción.
  // t: (key: string) => string;
}

export function useVoiceActionsHandler({
  articleMarkdown,
  setArticleMarkdown,
  mainTextareaRef,
  handleStartArticleFromPanel,
  setActiveAction, // Destructure setActiveAction
  initialSpeechLanguage,
  onToggleHelp,
}: UseVoiceActionsHandlerProps) {
  const [voiceActionState, setVoiceActionState] =
    useState<VoiceActionState>("idle");
  const [userInstructionKey, setUserInstructionKey] = useState<string | null>(
    null
  );

  // Helper function to insert text into the textarea
  const insertTextAtCursorOrSelection = (
    text: string,
    addSpaceAfter: boolean = true
  ) => {
    const textarea = mainTextareaRef.current;
    if (!textarea) return;

    const currentSelectionStart =
      textarea.selectionStart ?? articleMarkdown.length;
    const currentSelectionEnd = textarea.selectionEnd ?? articleMarkdown.length;
    const textToInsert = addSpaceAfter ? text + " " : text;

    const newArticleMarkdown =
      articleMarkdown.substring(0, currentSelectionStart) +
      textToInsert +
      articleMarkdown.substring(currentSelectionEnd);
    const newCursorPos = currentSelectionStart + textToInsert.length;

    setArticleMarkdown(newArticleMarkdown);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = newCursorPos;
      textarea.selectionEnd = newCursorPos;
    }, 0);
  };
  // Lógica para manejar comandos y transcripciones irá aquí

  const {
    isListening,
    isSupported,
    error: voiceError,
    toggleListening,
    setLanguage: setVoiceLanguage,
    currentLanguage: currentVoiceLanguage, // Get current language from useVoiceControl
    interimTranscript, // Obtener de useVoiceControl
    finalTranscript, // Obtener de useVoiceControl
  } = useVoiceControl({
    onTranscript: (text, isFinal) => {
      // TODO: Implementar lógica basada en voiceActionState
      if (isFinal) {
        const normalizedFinalTranscript = text.toLowerCase().trim();

        // 1. Comprobar si es un signo de puntuación
        const currentLangKey = (currentVoiceLanguage.split("-")[0] ||
          "en") as LanguageCode;
        const punctuationRules: PunctuationRule[] =
          VOICE_PUNCTUATION_MAP[currentLangKey] ||
          VOICE_PUNCTUATION_MAP["en"] ||
          [];

        let punctuationHandled = false;
        for (const rule of punctuationRules) {
          if (
            normalizedFinalTranscript ===
            rule.word_detection.toLowerCase().trim()
          ) {
            const noSpaceAfterChars = ["\n", "\n\n", "(", "[", "{"];
            const addSpace = !noSpaceAfterChars.includes(rule.char_sign);
            insertTextAtCursorOrSelection(rule.char_sign, addSpace);
            setUserInstructionKey("voicePrompts.punctuationInserted");
            setVoiceActionState("idle"); // Volver a idle después de la puntuación
            punctuationHandled = true;
            break;
          }
        }

        if (punctuationHandled) return; // Si se manejó puntuación, no hacer más.

        if (voiceActionState === "awaiting_prompt") {
          console.log("Prompt dictado (final):", text);
          handleStartArticleFromPanel(text);
          setVoiceActionState("idle");
        } else if (voiceActionState === "awaiting_heading_title") {
          console.log("Heading title dictado (final):", text);
          insertTextAtCursorOrSelection(text, false);
          setVoiceActionState("idle");
        } else if (voiceActionState === "awaiting_direct_dictation") {
          console.log("Direct dictation (final):", text);
          insertTextAtCursorOrSelection(text, true); // Añadir espacio después del texto dictado
          setVoiceActionState("idle"); // Volver a idle después de la inserción
        } else {
          console.log("Idle dictation (final):", text);
          insertTextAtCursorOrSelection(text, true); // Añadir espacio después del texto dictado
        }
      }
    },
    initialLanguage: initialSpeechLanguage,
    commands: VOICE_COMMANDS, // Usaremos los comandos definidos
    onCommand: (commandAction) => {
      console.log(
        "[useVoiceActionsHandler] Received commandAction:",
        commandAction
      ); // <-- LOG AQUÍ
      // TODO: Implementar lógica de manejo de comandos
      const textarea = mainTextareaRef.current;
      let textToInsertAtCursor: string | null = null;
      let newVoiceState: VoiceActionState = "idle"; // Por defecto vuelve a idle
      let executeImmediately = false;

      let finalMarkdown = articleMarkdown;
      let finalSelectionStart =
        textarea?.selectionStart ?? articleMarkdown.length;
      let finalSelectionEnd = textarea?.selectionEnd ?? articleMarkdown.length;
      let needsTextareaFocus = false;

      switch (commandAction) {
        case "CMD_CREATE_ARTICLE": // Asumiendo que "create" mapea a esto
          newVoiceState = "awaiting_prompt";
          setActiveAction("create"); // Set activeAction immediately
          // Podríamos añadir un toast o mensaje "Please dictate your prompt"
          break;
        case "CMD_HEADING_1":
          textToInsertAtCursor = "# ";
          newVoiceState = "awaiting_heading_title";
          break;
        case "CMD_HEADING_2":
          textToInsertAtCursor = "## ";
          newVoiceState = "awaiting_heading_title";
          break;
        case "CMD_HEADING_3":
          textToInsertAtCursor = "### ";
          newVoiceState = "awaiting_heading_title";
          break;
        case "CMD_NEW_LINE":
          textToInsertAtCursor = "\n";
          break;
        case "CMD_PERIOD":
          // Eliminar espacio al final si existe, luego añadir punto y espacio
          finalMarkdown = articleMarkdown.trimEnd() + ". ";
          finalSelectionStart = finalMarkdown.length;
          finalSelectionEnd = finalMarkdown.length;
          executeImmediately = true; // Actualiza el markdown inmediatamente
          break;
        case "CMD_WRITE_DOWN": // Nuevo comando para dictado directo
          newVoiceState = "awaiting_direct_dictation";
          console.log(
            "[useVoiceActionsHandler] Modo de dictado directo activado. Di tu texto."
          );
          // No se inserta texto aquí, solo se cambia el estado para el próximo transcript.
          break;
        case "CMD_SHOW_VOICE_HELP":
          onToggleHelp(); // Llama a la función para mostrar/ocultar la ayuda
          newVoiceState = "idle"; // Vuelve a idle, la página manejará el modal
          break;
        // Añadir más comandos aquí
      }

      setVoiceActionState(newVoiceState);

      if (textToInsertAtCursor) {
        const currentCursorPos =
          textarea?.selectionStart ?? articleMarkdown.length;
        const selectionEndForInsert =
          textarea?.selectionEnd ?? currentCursorPos;

        finalMarkdown =
          articleMarkdown.substring(0, currentCursorPos) +
          textToInsertAtCursor +
          articleMarkdown.substring(selectionEndForInsert);

        finalSelectionStart = currentCursorPos + textToInsertAtCursor.length;
        finalSelectionEnd = finalSelectionStart;
        executeImmediately = true;
      }

      if (executeImmediately) {
        setArticleMarkdown(finalMarkdown);
        needsTextareaFocus = true;
      }

      if (needsTextareaFocus && textarea) {
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = finalSelectionStart;
          textarea.selectionEnd = finalSelectionEnd;
        }, 0);
      }
    },
  });

  useEffect(() => {
    setVoiceLanguage(initialSpeechLanguage);
  }, [initialSpeechLanguage, setVoiceLanguage]);

  useEffect(() => {
    // Si se deja de escuchar por cualquier motivo (ej. toggle, error, etc.),
    // forzar el estado a idle para limpiar instrucciones.
    if (!isListening) {
      setVoiceActionState("idle");
    }
  }, [isListening]);
  useEffect(() => {
    switch (voiceActionState) {
      case "awaiting_prompt":
        setUserInstructionKey("voicePrompts.dictatePrompt");
        break;
      case "awaiting_heading_title":
        setUserInstructionKey("voicePrompts.dictateHeading");
        break;
      case "awaiting_direct_dictation":
        setUserInstructionKey("voicePrompts.dictateNow");
        break;
      default: // "idle" or any other state
        setUserInstructionKey(null);
        break;
    }
  }, [voiceActionState]);

  return {
    isListening,
    isSupported,
    voiceError,
    toggleListening,
    currentVoiceLanguage, // Return current language
    interimTranscript, // Devolver para page.tsx
    finalTranscript, // Devolver para page.tsx
    userInstructionKey, // Devolver la clave de instrucción para el usuario
  };
}
