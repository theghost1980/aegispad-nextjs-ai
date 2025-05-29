"use client";

import GeneralIcon from "@/components/icons/GeneralIcon"; // Importa el nuevo componente general
import { Button } from "@/components/ui/button";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic, // Renombrado para evitar conflicto con el tipo Image
  LayoutPanelLeft, // Icono para vista lado a lado
  LayoutPanelTop,
  Link,
  List,
  ListOrdered, // Añadido para tachado
  Minus, // Icono para vista apilada
  Quote,
  Strikethrough, // Añadido para tachado
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
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({
  onApplyFormat,
  onToggleImageModal,
  disabled = false,
  onToggleLayout, // Añadir aquí
  currentLayout, // Añadir aquí
}) => {
  const commonButtonProps = {
    variant: "outline" as const, // Asegura que el tipo sea el correcto para ButtonProps
    size: "sm" as const,
    disabled: disabled,
    className: "h-8 px-2", // Ajusta el padding y altura para botones más compactos
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30 mb-2 rounded-t-md">
      {/* Botones de formato básico */}
      <Button
        {...commonButtonProps}
        onClick={() => onApplyFormat("bold")}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        {...commonButtonProps}
        onClick={() => onApplyFormat("italic")}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        {...commonButtonProps}
        onClick={() => onApplyFormat("strikethrough")}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        {...commonButtonProps}
        onClick={() => onApplyFormat("link")}
        title="Insert Link (Ctrl+K)"
      >
        <Link className="h-4 w-4" />
      </Button>

      {/* Separador visual (opcional) */}
      <div className="h-6 w-px bg-border mx-1"></div>

      {/* Encabezados */}
      <Button
        {...commonButtonProps}
        onClick={() => onApplyFormat("h1")}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        {...commonButtonProps}
        onClick={() => onApplyFormat("h2")}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        {...commonButtonProps}
        onClick={() => onApplyFormat("h3")}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      {/* Separador visual (opcional) */}
      <div className="h-6 w-px bg-border mx-1"></div>

      {/* Listas */}
      <Button
        {...commonButtonProps}
        onClick={() => onApplyFormat("ul")}
        title="Bulleted List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        {...commonButtonProps}
        onClick={() => onApplyFormat("ol")}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      {/* Separador visual (opcional) */}
      <div className="h-6 w-px bg-border mx-1"></div>

      {/* Cita y Código */}
      <Button
        {...commonButtonProps}
        onClick={() => onApplyFormat("quote")}
        title="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        {...commonButtonProps}
        onClick={() => onApplyFormat("codeblock")}
        title="Code Block"
      >
        <Code className="h-4 w-4" />
      </Button>
      {/* <Button {...commonButtonProps} onClick={() => onApplyFormat("inlinecode")} title="Inline Code">
        <Code className="h-4 w-4" /> // Podrías usar un icono diferente o un toggle
      </Button> */}

      {/* Separador visual (opcional) */}
      <div className="h-6 w-px bg-border mx-1"></div>

      {/* Botón para Hivelens */}
      <Button
        {...commonButtonProps}
        onClick={onToggleImageModal}
        title="Insert Image from Hivelens"
      >
        <GeneralIcon iconName="hivelens" className="h-4 w-4" />
      </Button>

      {/* Botón para Imagen por URL */}
      <Button
        {...commonButtonProps}
        onClick={() => onApplyFormat("image_url")}
        title="Insert Image by URL"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
      <Button
        {...commonButtonProps}
        onClick={() => onApplyFormat("hr")}
        title="Horizontal Rule"
      >
        <Minus className="h-4 w-4" />
      </Button>

      {/* Separador visual (opcional) */}
      <div className="h-6 w-px bg-border mx-1"></div>

      {/* Botón para cambiar el diseño de la vista previa */}
      <Button
        {...commonButtonProps}
        onClick={onToggleLayout}
        title={
          currentLayout === "side"
            ? "Switch to Stacked View (Editor Top, Preview Bottom)"
            : "Switch to Side-by-Side View (Editor Left, Preview Right)"
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
