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
  Code, // Icono para subir imagen
  Heading,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic, // Renombrado para evitar conflicto con el tipo Image
  LayoutPanelLeft, // Icono para vista lado a lado
  LayoutPanelTop, // Icono para vista apilada
  Link,
  List,
  ListOrdered,
  Minus, // Icono genérico para encabezados
  Pilcrow, // Icono para estilos de texto (o similar)
  PlusCircle, // Icono para línea horizontal, también usado para HR
  Quote,
  Sparkles, // Import Sparkles icon
  Strikethrough, // Añadido para tachado
  UploadCloud, // Icono para subir imagen
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
  | "codeblock" // Para bloques de código
  // | "inlinecode" // Para código en línea (comentado si no se usa)
  | "image_url" // Nuevo tipo para insertar imagen por URL
  | "hr"; // Para línea horizontal

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
                // Prevenir que el dropdown se cierre inmediatamente si el panel AI abre un popover
                // Esto puede necesitar ajustes dependiendo de cómo AIImageGeneratorPanel maneje su apertura
                e.preventDefault();
              }}
              disabled={disabled}
            >
              <AIImageGeneratorPanel
                triggerComponent={
                  // Este botón interno será estilizado por DropdownMenuItem gracias a `asChild`
                  // y actuará como el trigger para el Popover de AIImageGeneratorPanel.
                  // Necesitas asegurarte que AIImageGeneratorPanel pueda tomar un componente simple como trigger
                  // y que este botón se estilice adecuadamente como un item de dropdown.
                  // Una forma es que el triggerComponent de AIImageGeneratorPanel sea un botón simple
                  // y aquí lo envolvemos.
                  // Si AIImageGeneratorPanel ya es un Popover completo, podrías necesitar
                  // controlar su estado de apertura desde aquí.
                  // Por simplicidad, asumimos que AIImageGeneratorPanel puede ser invocado así.
                  // Si AIImageGeneratorPanel es un Popover, su trigger debe ser un Button o similar.
                  // El `asChild` en DropdownMenuItem pasará las props de item al Button.
                  <Button
                    variant="ghost" // Para que se parezca a un item de dropdown
                    className="w-full justify-start px-2 py-1.5 text-sm font-normal relative flex cursor-default select-none items-center rounded-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    // Los estilos anteriores son para imitar un DropdownMenuItem
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

      {/* Botones que quedan fuera de los desplegables (si los hay) */}
      {/* Separador visual (opcional) */}
      <div className="h-6 w-px bg-border mx-1"></div>

      {/* Botón para cambiar el diseño de la vista previa */}
      {/* Este botón se mantiene como estaba, ya que es una acción de UI general */}
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

      {/* Ejemplo de cómo podrías integrar AIImageGeneratorPanel si no usas `asChild`
          y necesitas un botón que abra el panel. Este botón estaría fuera de los Dropdowns.
          Si lo quieres DENTRO de un DropdownMenu, la aproximación con `asChild` es mejor.
      */}
      {/* {onAIImageGenerated && (
        <Button
          {...commonButtonProps}
          // Este es un ejemplo si el AIImageGeneratorPanel fuera un botón directo en la barra
          // y no dentro de un DropdownMenu.
          // Para ponerlo en un DropdownMenu, la estrategia con `asChild` es la preferida.
          title="Generate Image with AI (Direct Button Example)"
          onClick={() => {
            // Aquí necesitarías una forma de abrir el AIImageGeneratorPanel,
            // por ejemplo, si AIImageGeneratorPanel tuviera un prop `isOpen` y `onOpenChange`.
            console.log("Trigger AI Image Panel (direct button example)");
          }}
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      )} */}
    </div>
  );
};
