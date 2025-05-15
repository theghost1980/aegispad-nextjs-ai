"use client";

import LoadingSpinner from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Eraser, ImageIcon, PencilLine, Wand2 } from "lucide-react";
import type { FC } from "react";

interface LanguageOption {
  value: string;
  label: string;
}

type InitialWorkflowType = "aiCreate" | "userWrite";

interface StartArticleCardProps {
  initialWorkflow: InitialWorkflowType;
  onInitialWorkflowChange: (value: InitialWorkflowType) => void;
  prompt: string;
  onPromptChange: (value: string) => void;
  generateMainImage: boolean;
  sourceLanguageForCreation: string;
  onSourceLanguageForCreationChange: (value: string) => void;
  onGenerateMainImageChange: (checked: boolean) => void;
  onMainAction: () => void;
  onClearAll: () => void;
  isLoading: boolean;
  currentOperationMessage: string | null;
  // availableLanguages: LanguageOption[]; // Podrías pasar esto como prop
  t: (
    key: keyof IntlMessages["ArticleForgePage"]["startArticleCard"],
    values?: Record<string, any>
  ) => string;
}

const StartArticleCard: FC<StartArticleCardProps> = ({
  initialWorkflow,
  onInitialWorkflowChange,
  prompt,
  onPromptChange,
  generateMainImage,
  sourceLanguageForCreation,
  onSourceLanguageForCreationChange,
  onGenerateMainImageChange,
  onMainAction,
  onClearAll,
  isLoading,
  currentOperationMessage,
  t,
}) => {
  // Si availableLanguages no se pasa como prop, puedes definirla aquí
  // o importarla si la tienes en un archivo de constantes.
  // Por ahora, la copio de ArticleForgePage para que el componente funcione.
  const availableLanguages: LanguageOption[] = [
    { value: "Spanish", label: "Spanish" },
    { value: "French", label: "French" },
    { value: "German", label: "German" },
    { value: "Japanese", label: "Japanese" },
    { value: "Chinese (Simplified)", label: "Chinese (Simplified)" },
    { value: "Russian", label: "Russian" },
    { value: "Portuguese (Brazil)", label: "Portuguese (Brazil)" },
    { value: "Italian", label: "Italian" },
    { value: "Korean", label: "Korean" },
    { value: "Arabic", label: "Arabic" },
    { value: "English", label: "English" }, // Asegúrate que el valor por defecto esté aquí
  ];
  const mainActionButtonText =
    initialWorkflow === "aiCreate"
      ? t("aiCreateButtonText")
      : t("userWriteButtonText");

  const mainActionButtonIcon =
    initialWorkflow === "aiCreate" ? (
      <Wand2 className="mr-2 h-4 w-4" />
    ) : (
      <PencilLine className="mr-2 h-4 w-4" />
    );

  const isMainButtonDisabled =
    initialWorkflow === "aiCreate"
      ? isLoading || !prompt.trim() || !sourceLanguageForCreation.trim() // Deshabilitar si no hay idioma fuente
      : isLoading;

  const currentLoadingMessageForButton =
    initialWorkflow === "aiCreate"
      ? generateMainImage
        ? t("creatingArticleWithImageMessage")
        : t("creatingArticleMessage")
      : t("startingUserWritingMessage");

  return (
    <Card className="shadow-lg max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          {initialWorkflow === "aiCreate" ? (
            <Wand2 className="mr-2 h-6 w-6 text-primary" />
          ) : (
            <PencilLine className="mr-2 h-6 w-6 text-primary" />
          )}
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-lg font-medium">{t("workflowTitle")}</Label>
          <RadioGroup
            value={initialWorkflow}
            onValueChange={onInitialWorkflowChange}
            className="mt-2 space-y-2"
            disabled={isLoading}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="aiCreate" id="workflow-ai-create" />
              <Label htmlFor="workflow-ai-create" className="font-normal">
                {t("aiCreateLabel")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="userWrite" id="workflow-user-write" />
              <Label htmlFor="workflow-user-write" className="font-normal">
                {t("userWriteLabel")}
              </Label>
            </div>
          </RadioGroup>
        </div>

        {initialWorkflow === "aiCreate" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="sourceLanguage" className="text-lg font-medium">
                {t("sourceLanguageLabel" as any) || "Creation Language"}
              </Label>
              <Select
                value={sourceLanguageForCreation}
                onValueChange={onSourceLanguageForCreationChange}
                disabled={isLoading}
              >
                <SelectTrigger id="sourceLanguage" className="mt-1 text-base">
                  <SelectValue
                    placeholder={
                      t("selectSourceLanguagePlaceholder" as any) ||
                      "Select article language"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="prompt" className="text-lg font-medium">
                {t("promptLabel")}
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder={t("promptPlaceholder")}
                className="min-h-[120px] mt-1 text-base"
                disabled={isLoading}
                aria-label={t("promptLabel")}
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="generateMainImage"
                checked={generateMainImage}
                onCheckedChange={onGenerateMainImageChange}
                disabled={isLoading}
                aria-label={t("generateImageLabel")}
              />
              <Label
                htmlFor="generateMainImage"
                className="text-base font-normal cursor-pointer"
              >
                <ImageIcon className="inline-block mr-2 h-5 w-5 align-text-bottom" />
                {t("generateImageLabel")}
              </Label>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button onClick={onClearAll} variant="outline" disabled={isLoading}>
          <Eraser className="mr-2 h-4 w-4" /> {t("clearAllButton")}
        </Button>
        <Button onClick={onMainAction} disabled={isMainButtonDisabled}>
          {isLoading &&
          currentOperationMessage === currentLoadingMessageForButton ? (
            <LoadingSpinner className="mr-2" size={16} />
          ) : (
            mainActionButtonIcon
          )}
          {mainActionButtonText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StartArticleCard;
