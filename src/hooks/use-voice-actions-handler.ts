import {
  PunctuationRule,
  VOICE_COMMANDS,
  VOICE_PUNCTUATION_MAP,
} from "@/constants/constants";
import { ActiveEditorAction } from "@/types/general.types";
import { RefObject, useEffect, useState } from "react";
import { useVoiceControl } from "./use-voice-control";

type VoiceActionState =
  | "idle"
  | "awaiting_prompt"
  | "awaiting_heading_title"
  | "awaiting_direct_dictation";

export interface UseVoiceActionsHandlerProps {
  articleMarkdown: string;
  setArticleMarkdown: (markdown: string | ((prev: string) => string)) => void;
  mainTextareaRef: RefObject<HTMLTextAreaElement>;
  handleStartArticleFromPanel: (promptText: string) => void;
  setActiveAction: (action: ActiveEditorAction) => void;
  initialSpeechLanguage: string;
  onToggleHelp: () => void;
  locale: string;
  userRole: string | null;
}

export function useVoiceActionsHandler({
  articleMarkdown,
  setArticleMarkdown,
  mainTextareaRef,
  handleStartArticleFromPanel,
  setActiveAction,
  initialSpeechLanguage,
  onToggleHelp,
  locale,
  userRole,
}: UseVoiceActionsHandlerProps) {
  const [voiceActionState, setVoiceActionState] =
    useState<VoiceActionState>("idle");
  const [userInstructionKey, setUserInstructionKey] = useState<string | null>(
    null
  );

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

  useEffect(() => {
    console.log(
      `[useVoiceActionsHandler] Mounted/Updated. initialSpeechLanguage prop: ${initialSpeechLanguage}, locale prop: ${locale}`
    );
  }, [initialSpeechLanguage, locale]);

  const {
    isListening,
    isSupported,
    error: voiceError,
    toggleListening,
    setLanguage: setVoiceLanguage,
    currentLanguage: currentVoiceLanguage,
    interimTranscript,
    finalTranscript,
  } = useVoiceControl({
    onTranscript: (text, isFinal) => {
      // TODO: Implementar lógica basada en voiceActionState
      if (isFinal) {
        const normalizedFinalTranscript = text.toLowerCase().trim();

        const baseLang = currentVoiceLanguage.split("-")[0];
        const punctuationRules: PunctuationRule[] =
          VOICE_PUNCTUATION_MAP[
            currentVoiceLanguage as keyof typeof VOICE_PUNCTUATION_MAP
          ] ||
          VOICE_PUNCTUATION_MAP[
            baseLang as keyof typeof VOICE_PUNCTUATION_MAP
          ] ||
          VOICE_PUNCTUATION_MAP["en-US"] ||
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
            setVoiceActionState("idle");
            punctuationHandled = true;
            break;
          }
        }

        if (punctuationHandled) return;

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
          insertTextAtCursorOrSelection(text, true);
          setVoiceActionState("idle");
        } else {
          console.log("Idle dictation (final):", text);
          insertTextAtCursorOrSelection(text, true);
        }
      }
    },
    initialLanguage: initialSpeechLanguage,
    commands: VOICE_COMMANDS,
    onCommand: (commandAction) => {
      console.log(
        "[useVoiceActionsHandler] Received commandAction:",
        commandAction
      );
      // TODO: Implementar lógica de manejo de comandos
      const textarea = mainTextareaRef.current;
      let textToInsertAtCursor: string | null = null;
      let newVoiceState: VoiceActionState = "idle";
      let executeImmediately = false;

      let finalMarkdown = articleMarkdown;
      let finalSelectionStart =
        textarea?.selectionStart ?? articleMarkdown.length;
      let finalSelectionEnd = textarea?.selectionEnd ?? articleMarkdown.length;
      let needsTextareaFocus = false;

      switch (commandAction) {
        case "CMD_CREATE_ARTICLE":
          if (userRole === "admin" && userRole !== null) {
            newVoiceState = "awaiting_prompt";
            setActiveAction("create");
          } else {
            textToInsertAtCursor = ":) ";
            newVoiceState = "idle";
          }
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
          finalMarkdown = articleMarkdown.trimEnd() + ". ";
          finalSelectionStart = finalMarkdown.length;
          finalSelectionEnd = finalMarkdown.length;
          executeImmediately = true;
          break;
        case "CMD_WRITE_DOWN":
          newVoiceState = "awaiting_direct_dictation";
          console.log(
            "[useVoiceActionsHandler] Modo de dictado directo activado. Di tu texto."
          );
          break;
        case "CMD_SHOW_VOICE_HELP":
          onToggleHelp();
          newVoiceState = "idle";
          break;
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
