"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckSquare,
  Dock,
  MinusCircle,
  PlusCircle,
  SquareArrowOutUpRight, // Icono para desacoplar
  XSquare,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Rnd } from "react-rnd"; // Importar Rnd

interface LineItem {
  id: string; // For stable keys
  text: string;
  originalIndex: number; // Index in the initial revisedLines array
}

interface LineReviewerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** The original markdown content before AI revision. */
  originalMarkdown: string;
  /** The AI revised markdown content. */
  revisedMarkdown: string;
  /**
   * Called when a user wants to apply a specific line from the AI's revision.
   * The parent component will decide how to integrate this into the main editor.
   * @param originalLineIndex - The index of this line in the *initial* full revisedMarkdown.
   * @param revisedLineText - The text of the revised line to apply.
   */
  onApplyLine: (originalLineIndex: number, revisedLineText: string) => void;
  /**
   * Called when the user is done and wants to apply all *currently visible* lines in the reviewer
   * as the new content for the editor.
   */
  onApplyAllVisibleChanges: (newFullMarkdown: string) => void;
  /** For translations within this component */
  tLineReviewer: {
    title: string;
    description: string;
    applyLineButtonTitle: string;
    removeLineButtonTitle: string;
    applyAllVisibleButtonText: string;
    closeButtonText: string;
    noLinesToReviewText: string;
  };
}

export const LineReviewer: React.FC<LineReviewerProps> = ({
  isOpen,
  onOpenChange,
  originalMarkdown, // Kept for potential future diffing logic, not directly used in this version
  revisedMarkdown,
  onApplyLine,
  onApplyAllVisibleChanges,
  tLineReviewer,
}) => {
  const [displayLines, setDisplayLines] = useState<LineItem[]>([]);
  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    // Poblar líneas si el componente está visible (modal o flotante) y hay markdown revisado
    if ((isOpen || isFloating) && revisedMarkdown) {
      const revisedLinesArray = revisedMarkdown.split("\n");
      setDisplayLines(
        revisedLinesArray.map((text, index) => ({
          id: `${index}-${Math.random().toString(36).substring(7)}`, // More unique ID
          text,
          originalIndex: index, // This is the index in the *revisedMarkdown*
        }))
      );
    } else if (!isOpen && !isFloating) {
      // Limpiar líneas solo si el modal está cerrado Y no está en modo flotante
      setDisplayLines([]);
    }
    // Asegurarse de que el efecto se ejecute si cambia la visibilidad (isOpen o isFloating) o el contenido.
  }, [isOpen, isFloating, revisedMarkdown]);

  const handleRemoveLineFromView = (idToRemove: string) => {
    setDisplayLines((prevLines) =>
      prevLines.filter((line) => line.id !== idToRemove)
    );
  };

  const handleApplySingleLine = (line: LineItem) => {
    // The parent component will handle how to apply this.
    // 'line.originalIndex' refers to its index in the initial 'revisedMarkdown'.
    onApplyLine(line.originalIndex, line.text);
    // Optional: remove the line from this view after applying, or mark as applied.
    // For now, we'll keep it, allowing multiple applications or further review.
    // To remove after applying: handleRemoveLineFromView(line.id);
  };

  const handleApplyAllAndClose = () => {
    const newFullMarkdown = displayLines.map((line) => line.text).join("\n");
    onApplyAllVisibleChanges(newFullMarkdown);
    onOpenChange(false); // Close after applying all
  };

  const handleUndock = () => {
    setIsFloating(true);
    onOpenChange(false); // Cierra la versión modal
  };

  const handleDockOrCloseFloating = () => {
    setIsFloating(false);
    // Opcionalmente, podrías querer reabrir el modal aquí o dejar que el padre lo maneje
    // onOpenChange(true); // Si quieres que se reabra como modal
  };

  if (!isOpen && !isFloating) {
    return null;
  }

  const reviewerContent = (isFloatingPanel = false) => (
    <>
      {/* Header Section - No outer padding here, container should handle it */}
      <div
        className={
          isFloatingPanel ? "line-reviewer-drag-handle cursor-move" : ""
        }
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            {" "}
            {/* Manual Title */}
            {tLineReviewer.title}
          </h2>
          {!isFloatingPanel ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndock}
              title="Undock Panel"
              className="-mr-2" // Adjust margin if needed
            >
              <SquareArrowOutUpRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDockOrCloseFloating}
              title="Dock Panel / Close"
              className="-mr-2" // Adjust margin if needed
            >
              <Dock className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {" "}
          {/* Manual Description */}
          {tLineReviewer.description}
        </p>
      </div>

      {/* ScrollArea should take available space */}
      <ScrollArea className="border rounded-md bg-white flex-1 min-h-0 overflow-y-auto">
        <div className="font-mono text-sm p-2">
          {displayLines.map((line) => (
            <div
              key={line.id}
              className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-border/50 hover:bg-muted/40 group"
            >
              <span className="flex-grow whitespace-pre-wrap break-words py-0.5">
                {line.text.trim() === "" ? "\u00A0" : line.text}
              </span>
              <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title={tLineReviewer.applyLineButtonTitle}
                  onClick={() => handleApplySingleLine(line)}
                >
                  <PlusCircle className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title={tLineReviewer.removeLineButtonTitle}
                  onClick={() => handleRemoveLineFromView(line.id)}
                >
                  <MinusCircle className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
          {displayLines.length === 0 && (
            <p className="text-muted-foreground p-4 text-center">
              {tLineReviewer.noLinesToReviewText}
            </p>
          )}
        </div>
      </ScrollArea>
      {/* Footer Section - No outer padding here, container should handle it */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        {!isFloatingPanel ? (
          <DialogClose asChild>
            <Button variant="outline">
              <XSquare className="mr-2 h-4 w-4" />
              {tLineReviewer.closeButtonText}
            </Button>
          </DialogClose>
        ) : null}
        <Button
          onClick={() => {
            handleApplyAllAndClose();
            if (isFloatingPanel) {
              handleDockOrCloseFloating(); // También cierra el panel flotante
            }
          }}
          disabled={displayLines.length === 0}
        >
          <CheckSquare className="mr-2 h-4 w-4" />
          {tLineReviewer.applyAllVisibleButtonText}
        </Button>
      </div>
    </>
  );

  if (isFloating) {
    // Placeholder para el panel flotante. Aquí es donde integrarías <Rnd>
    return (
      <Rnd
        default={{
          x: window.innerWidth / 2 - 300, // Centrar horizontalmente inicialmente
          y: window.innerHeight / 2 - 225, // Centrar verticalmente inicialmente
          width: 600,
          height: 450,
        }}
        minWidth={350}
        minHeight={300}
        bounds="window" // Restringir el arrastre a la ventana del navegador
        enableResizing // Habilitar todas las manijas de redimensionamiento
        className="bg-yellow-50 border border-yellow-200 shadow-xl rounded-lg p-6 flex flex-col z-50 overflow-hidden"
        dragHandleClassName="line-reviewer-drag-handle" // Clase para el área de arrastre (opcional, pero útil)
      >
        {reviewerContent(true)}
      </Rnd>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[70vw] md:max-w-[60vw] lg:max-w-[50vw] w-full flex flex-col max-h-[85vh] gap-4 bg-yellow-50 border-yellow-200 overflow-hidden">
        {" "}
        {/* El padding p-6 ya está aplicado por DialogContent */}
        {reviewerContent(false)}
      </DialogContent>
    </Dialog>
  );
};
