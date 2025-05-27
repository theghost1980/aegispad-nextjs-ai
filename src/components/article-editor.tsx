"use client";

import { ImageSearchAndInsert } from "@/components/custom/ImageSearchAndInsert";
import MarkdownPreview from "@/components/markdown-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  Eye,
  PanelLeftClose,
  PanelRightOpen,
} from "lucide-react"; // Importar nuevos iconos
import { useTranslations } from "next-intl";
import { type FC, useState } from "react";

interface ArticleEditorProps {
  markdown: string;
  onMarkdownChange?: (markdown: string) => void;
  isLoading?: boolean;
  readOnly?: boolean;
  collapsable?: boolean;
  allowEditorHide?: boolean;
}

const ArticleEditor: FC<ArticleEditorProps> = ({
  markdown,
  onMarkdownChange = () => {},
  isLoading = false,
  readOnly = false,
  collapsable = false,
  allowEditorHide = false,
}) => {
  const t = useTranslations("ArticleEditor");

  const [isEditablePanelCollapsed, setIsEditablePanelCollapsed] =
    useState(false);
  const [isPreviewPanelCollapsed, setIsPreviewPanelCollapsed] = useState(false);
  const [isEditorPanelForceHidden, setIsEditorPanelForceHidden] =
    useState(false);

  const handleImagesForMarkdown = (urls: string[]) => {
    console.log("Imágenes de Hivelens a insertar:", urls);
    // Lógica para agregar a tu editor de Markdown:
    // urls.forEach(url => editor.insert(`!`));
  };

  return (
    <div className="relative">
      {" "}
      {/* Contenedor relativo para el botón de toggle lateral */}
      {/* Botón lateral para ocultar/mostrar el panel editor */}
      {allowEditorHide && !readOnly && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsEditorPanelForceHidden(!isEditorPanelForceHidden)}
          className="absolute top-1/2 transform -translate-y-1/2 z-20 p-1 h-12 w-8 rounded-md shadow-lg bg-background hover:bg-muted border-border"
          // Ajuste de 'left':
          // Si el editor está oculto, el botón se pega a la izquierda.
          // Si el editor está visible, el botón se posiciona justo a la izquierda de la línea central del gap entre los dos paneles.
          // Asumiendo gap-6 (1.5rem) y ancho del botón w-8 (2rem).
          // Posición del borde derecho del botón = 50% (centro) - 0.75rem (mitad del gap).
          // Posición del borde izquierdo del botón = 50% - 0.75rem - 2rem (ancho del botón).
          style={{
            left: isEditorPanelForceHidden
              ? "4px"
              : "calc(50% - 0.75rem - 2rem)",
          }}
          aria-label={
            isEditorPanelForceHidden ? "Hide editor panel" : "Show editor panel"
          }
        >
          {isEditorPanelForceHidden ? (
            <PanelRightOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
      )}
      <div
        className={`grid gap-6 ${
          allowEditorHide && !readOnly && isEditorPanelForceHidden
            ? "grid-cols-1" // Solo una columna si el editor está forzado a ocultarse
            : "grid-cols-1 md:grid-cols-2" // Dos columnas en otros casos
        }`}
      >
        {!(allowEditorHide && !readOnly && isEditorPanelForceHidden) && (
          <Card
            className={`flex flex-col ${
              collapsable && isEditablePanelCollapsed
                ? "h-auto"
                : "min-h-[60px]"
            } transition-all duration-300 ease-in-out`}
          >
            <CardHeader
              className={`flex flex-row items-center ${
                collapsable ? "justify-between" : "justify-start"
              } py-2 px-4 border-b`}
            >
              <CardTitle className="text-lg flex items-center">
                <Edit3 className="mr-2 h-5 w-5" />
                {t("markdownEditorTitle")}
              </CardTitle>
              {collapsable && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setIsEditablePanelCollapsed(!isEditablePanelCollapsed)
                  }
                  aria-label={
                    isEditablePanelCollapsed
                      ? "Expand editor content"
                      : "Collapse editor content"
                  }
                  className="h-8 w-8"
                >
                  {isEditablePanelCollapsed ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronUp className="h-5 w-5" />
                  )}
                </Button>
              )}
            </CardHeader>
            {/* TESTING images here for now */}
            <ImageSearchAndInsert
              onInsertImages={handleImagesForMarkdown}
              //TODO for production "https://hivelens.duckdns.org/api/search"
              apiEndpoint="http://localhost:9009/api/search"
              mode="inline" // o "modal"
              trigger={<Button>Buscar Imágenes en Hivelens</Button>}
              maxSelectable={3}
              // Si quisieras buscar por un tag específico por defecto o siempre:
              // apiExtraParams={{ tags: "photography" }}
            />
            {/* END TESTings */}
            {(!collapsable || !isEditablePanelCollapsed) && (
              <CardContent className="p-0 flex-1 overflow-auto">
                <Textarea
                  value={markdown}
                  onChange={(e) => onMarkdownChange(e.target.value)}
                  placeholder={t("markdownPlaceholder")}
                  className="min-h-[400px] text-sm resize-y h-full"
                  disabled={isLoading || readOnly}
                  aria-label={t("ariaLabelEditor")}
                  style={{
                    minHeight: collapsable ? "calc(100vh - 300px)" : "400px",
                  }}
                />
              </CardContent>
            )}
          </Card>
        )}
        <Card
          className={`flex flex-col ${
            collapsable && isPreviewPanelCollapsed ? "h-auto" : "min-h-[60px]"
          } transition-all duration-300 ease-in-out 
          ${
            allowEditorHide && !readOnly && isEditorPanelForceHidden
              ? "md:col-span-1"
              : ""
          } 
          `}
        >
          <CardHeader
            className={`flex flex-row items-center ${
              collapsable ? "justify-between" : "justify-start"
            } py-2 px-4 border-b`}
          >
            <CardTitle className="text-lg flex items-center">
              <Eye className="mr-2 h-5 w-5" />
              {t("previewTitle")}
            </CardTitle>
            {collapsable && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setIsPreviewPanelCollapsed(!isPreviewPanelCollapsed)
                }
                aria-label={
                  isPreviewPanelCollapsed
                    ? "Expand preview content"
                    : "Collapse preview content"
                }
                className="h-8 w-8"
              >
                {isPreviewPanelCollapsed ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </Button>
            )}
          </CardHeader>
          {(!collapsable || !isPreviewPanelCollapsed) && (
            <CardContent className="p-4 flex-1 overflow-auto">
              <MarkdownPreview
                markdown={markdown}
                ariaLabel={t("ariaLabelPreview")}
                minHeight={collapsable ? "calc(100vh - 300px)" : "400px"}
              />
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ArticleEditor;
