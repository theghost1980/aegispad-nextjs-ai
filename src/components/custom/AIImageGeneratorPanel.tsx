"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHiveAuth } from "@/hooks/use-hive-auth";
import { Image as ImageIcon, Loader2, Sparkles } from "lucide-react";
import NextImage from "next/image";
import { useState } from "react";

interface AIImageGeneratorPanelProps {
  triggerComponent?: React.ReactNode;
  onImageGenerated?: (imageUrl: string, altText?: string) => void;
}

type GenerationService = "gemini_image_generation";

export function AIImageGeneratorPanel(props: AIImageGeneratorPanelProps) {
  const { triggerComponent, onImageGenerated } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [selectedService, setSelectedService] =
    useState<GenerationService | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const { authenticatedFetch } = useHiveAuth();

  const handleServiceSelect = (service: GenerationService) => {
    setSelectedService(service);
    setPrompt("");
    setGeneratedImageUrl(null);
    setError(null);
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim() || !selectedService) return;

    setIsLoading(true);
    setGeneratedImageUrl(null);
    setError(null);

    try {
      // Actualmente solo tenemos un servicio, pero esto se puede expandir
      if (selectedService === "gemini_image_generation") {
        const response = await authenticatedFetch("/api/ai/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `Error ${response.status}: Failed to generate image`
          );
        }
        const result = await response.json();
        console.log("Copy result:", result); //TODO REM
        setGeneratedImageUrl(result.imageUrl);
        if (onImageGenerated) {
          onImageGenerated(result.imageUrl, prompt);
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      console.error("Error generating AI image:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setIsOpen(false);
    setSelectedService(null);
    setPrompt("");
    setGeneratedImageUrl(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetAndClose();
        } else {
          setIsOpen(true);
        }
      }}
    >
      <DialogTrigger asChild>
        {triggerComponent ? (
          triggerComponent
        ) : (
          <Button variant="outline">
            <Sparkles className="mr-2 h-4 w-4" /> IA IMG
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generador de Imágenes con IA</DialogTitle>
        </DialogHeader>
        {!selectedService ? (
          <div className="py-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Selecciona un servicio para generar tu imagen:
            </p>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleServiceSelect("gemini_image_generation")}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Gemini AI
            </Button>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedService(null)}
                className="mb-2"
              >
                &larr; Cambiar Servicio
              </Button>
              <Label htmlFor="ai-prompt" className="text-right">
                Prompt para Gemini:
              </Label>
              <Input
                id="ai-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ej: Un gato astronauta en la luna"
                disabled={isLoading}
              />
            </div>

            {isLoading && (
              <div className="flex items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generando imagen... (esto puede tardar un momento)
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {generatedImageUrl && !isLoading && (
              <div className="border rounded-md p-2">
                <NextImage
                  src={generatedImageUrl}
                  alt="Imagen generada por IA"
                  width={400}
                  height={400}
                  className="rounded-md w-full h-auto"
                />
                {/* Aquí podríamos añadir un botón para "usar esta imagen" */}
              </div>
            )}
          </div>
        )}
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={resetAndClose}>
              Cerrar
            </Button>
          </DialogClose>
          {selectedService && (
            <Button
              type="button"
              onClick={handleGenerateImage}
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
