"use client";

import { AIImageGeneratorPanel } from "@/components/custom/AIImageGeneratorPanel";
import GeneralIcon from "@/components/icons/GeneralIcon"; // Importa el nuevo componente general
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MarkdownToolBarTranslations } from "@/types/translation-types";
import {
  Bold,
  Code,
  Heading,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  LayoutPanelLeft,
  LayoutPanelTop,
  Link,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  PlusCircle,
  Quote,
  Sparkles,
  Strikethrough,
  UploadCloud,
} from "lucide-react";
import React from "react";

export type MarkdownFormatType =
  | "bold"
  | "italic"
  | "strikethrough"
  | "link"
  | "h1"
  | "h2"
  | "h3"
  | "ul"
  | "ol"
  | "quote"
  | "codeblock"
  // | "inlinecode" // Para código en línea (comentado si no se usa)
  | "image_url"
  | "hr";

interface MarkdownToolbarProps {
  /**
   * Función que se llama cuando se hace clic en un botón de formato.
   * Deberá manejar la lógica para aplicar el formato Markdown al texto.
   */
  onApplyFormat: (formatType: MarkdownFormatType) => void;
  /**
   * Función que se llama para abrir el modal de inserción de imágenes.
   */
  onToggleImageModal: () => void;
  /**
   * Indica si los botones de la barra de herramientas deben estar deshabilitados.
   */
  disabled?: boolean;
  /**
   * Función que se llama para cambiar el diseño de la vista previa.
   */
  onToggleLayout: () => void;
  /**
   * El diseño actual de la vista previa.
   */
  currentLayout: "side" | "bottom";
  /**
   * Callback for when an AI image is generated and ready to be inserted.
   */
  onAIImageGenerated?: (imageUrl: string, altText?: string) => void;
  /**
   * Función que se llama para iniciar el proceso de subida de una imagen desde el dispositivo del usuario.
   */
  onTriggerDeviceImageUpload?: () => void;
  t: MarkdownToolBarTranslations;
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({
  onApplyFormat,
  onToggleImageModal,
  disabled = false,
  onToggleLayout, // Añadir aquí
  currentLayout, // Añadir aquí
  onAIImageGenerated,
  onTriggerDeviceImageUpload,
  t,
}) => {
  const commonButtonProps = {
    variant: "outline" as const, // Asegura que el tipo sea el correcto para ButtonProps
    size: "sm" as const,
    disabled: disabled,
    className: "h-8 px-2", // Ajusta el padding y altura para botones más compactos
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30 mb-2 rounded-t-md">
      {/* Grupo: Estilos de Texto */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button {...commonButtonProps} title="Text Styles">
            <Pilcrow className="h-4 w-4 mr-1 md:mr-0" />{" "}
            <span className="hidden md:inline ml-1">
              {t("styles.buttonLabel")}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => onApplyFormat("bold")}
            disabled={disabled}
          >
            <Bold className="mr-2 h-4 w-4" /> {t("styles.bold")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onApplyFormat("italic")}
            disabled={disabled}
          >
            <Italic className="mr-2 h-4 w-4" /> {t("styles.italic")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onApplyFormat("strikethrough")}
            disabled={disabled}
          >
            <Strikethrough className="mr-2 h-4 w-4" />{" "}
            {t("styles.strikethrough")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Grupo: Encabezados */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button {...commonButtonProps} title={t("headings.title")}>
            <Heading className="h-4 w-4 mr-1 md:mr-0" />{" "}
            <span className="hidden md:inline ml-1">
              {t("headings.buttonLabel")}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => onApplyFormat("h1")}
            disabled={disabled}
          >
            <Heading1 className="mr-2 h-4 w-4" /> {t("headings.h1")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onApplyFormat("h2")}
            disabled={disabled}
          >
            <Heading2 className="mr-2 h-4 w-4" /> {t("headings.h2")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onApplyFormat("h3")}
            disabled={disabled}
          >
            <Heading3 className="mr-2 h-4 w-4" /> {t("headings.h3")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Grupo: Bloques (Listas, Cita, Código, HR) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button {...commonButtonProps} title={t("blocks.title")}>
            <List className="h-4 w-4 mr-1 md:mr-0" />{" "}
            <span className="hidden md:inline ml-1">
              {t("blocks.buttonLabel")}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => onApplyFormat("ul")}
            disabled={disabled}
          >
            <List className="mr-2 h-4 w-4" /> {t("blocks.bulletedList")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onApplyFormat("ol")}
            disabled={disabled}
          >
            <ListOrdered className="mr-2 h-4 w-4" /> {t("blocks.numberedList")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onApplyFormat("quote")}
            disabled={disabled}
          >
            <Quote className="mr-2 h-4 w-4" /> {t("blocks.blockquote")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onApplyFormat("codeblock")}
            disabled={disabled}
          >
            <Code className="mr-2 h-4 w-4" /> {t("blocks.codeBlock")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onApplyFormat("hr")}
            disabled={disabled}
          >
            <Minus className="mr-2 h-4 w-4" /> {t("blocks.horizontalRule")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Grupo: Insertar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button {...commonButtonProps} title={t("insert.title")}>
            <PlusCircle className="h-4 w-4 mr-1 md:mr-0" />{" "}
            <span className="hidden md:inline ml-1">
              {t("insert.buttonLabel")}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => onApplyFormat("link")}
            disabled={disabled}
          >
            <Link className="mr-2 h-4 w-4" /> {t("insert.link")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onToggleImageModal} disabled={disabled}>
            <GeneralIcon iconName="hivelens" className="mr-2 h-4 w-4" />{" "}
            {t("insert.imageFromHivelens")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onApplyFormat("image_url")}
            disabled={disabled}
          >
            <ImageIcon className="mr-2 h-4 w-4" /> {t("insert.imageByUrl")}
          </DropdownMenuItem>
          {onTriggerDeviceImageUpload && (
            <DropdownMenuItem
              onClick={onTriggerDeviceImageUpload}
              disabled={disabled}
            >
              <UploadCloud className="mr-2 h-4 w-4" />{" "}
              {t("insert.uploadImageFromDevice")}
            </DropdownMenuItem>
          )}
          {onAIImageGenerated && (
            <DropdownMenuItem
              asChild
              onSelect={(e) => {
                e.preventDefault();
              }}
              disabled={disabled}
            >
              <AIImageGeneratorPanel
                triggerComponent={
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-2 py-1.5 text-sm font-normal relative flex cursor-default select-none items-center rounded-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t("insert.generateAiImage")}
                  </Button>
                }
                onImageGenerated={onAIImageGenerated}
              />
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-6 w-px bg-border mx-1"></div>

      <Button
        {...commonButtonProps}
        onClick={onToggleLayout}
        title={
          currentLayout === "side"
            ? t("layout.switchToStackedView")
            : t("layout.switchToSideBySideView")
        }
      >
        {currentLayout === "side" ? (
          <LayoutPanelTop className="h-4 w-4" />
        ) : (
          <LayoutPanelLeft className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};
