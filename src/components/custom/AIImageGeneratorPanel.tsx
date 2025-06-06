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
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import NextImage from "next/image";
import { useEffect, useState } from "react";

interface AIImageGeneratorPanelProps {
  triggerComponent?: React.ReactNode;
  onImageGenerated?: (imageUrl: string, altText?: string) => void;
}

type GenerationService = "gemini_image_generation";

export function AIImageGeneratorPanel(props: AIImageGeneratorPanelProps) {
  const COOLDOWN_DURATION_SECONDS = 60;

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
  const [lastGenerationTimestamp, setLastGenerationTimestamp] = useState<
    number | null
  >(null);
  const [cooldownSecondsRemaining, setCooldownSecondsRemaining] =
    useState<number>(0);

  const { authenticatedFetch } = useHiveAuth();
  const { toast } = useToast();
  const t = useTranslations("AIImageGeneratorPanel");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lastGenerationTimestamp) {
      const now = Date.now();
      const timePassed = Math.floor((now - lastGenerationTimestamp) / 1000);
      const remaining = COOLDOWN_DURATION_SECONDS - timePassed;

      if (remaining > 0) {
        setCooldownSecondsRemaining(remaining);
        timer = setInterval(() => {
          setCooldownSecondsRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
    return () => clearInterval(timer);
  }, [lastGenerationTimestamp]);

  const handleServiceSelect = (service: GenerationService) => {
    setSelectedService(service);
    setPrompt("");
    setGeneratedImageUrl(null);
    setError(null);
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim() || !selectedService) return;

    if (cooldownSecondsRemaining > 0) {
      toast({
        title: t("cooldownToastTitle"),
        description: t("cooldownToastDescription", {
          seconds: cooldownSecondsRemaining,
        }),
        variant: "default",
      });
      return;
    }

    setLastGenerationTimestamp(Date.now());

    setIsLoading(true);
    setGeneratedImageUrl(null);
    setError(null);

    try {
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
        setGeneratedImageUrl(result.imageUrl);
        setLastGenerationTimestamp(Date.now());
        if (onImageGenerated) {
          onImageGenerated(result.imageUrl, prompt);
        }
      }
    } catch (err: any) {
      setError(err.message || t("apiErrorFallback"));
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
            <Sparkles className="mr-2 h-4 w-4" />{" "}
            {t("defaultTriggerButtonLabel")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
        </DialogHeader>
        {!selectedService ? (
          <div className="py-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              {t("selectServicePrompt")}
            </p>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleServiceSelect("gemini_image_generation")}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              {t("geminiServiceButton")}
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
                {t("changeServiceButton")}
              </Button>
              <Label htmlFor="ai-prompt" className="text-right">
                {t("promptLabel")}
              </Label>
              <Input
                id="ai-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("promptPlaceholder")}
                disabled={isLoading}
              />
            </div>

            {isLoading && (
              <div className="flex items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("generatingMessage")}
              </div>
            )}
            {cooldownSecondsRemaining > 0 && !isLoading && (
              <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
                {t("cooldownMessage", {
                  seconds: cooldownSecondsRemaining,
                })}
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {generatedImageUrl && !isLoading && (
              <div className="border rounded-md p-2">
                <NextImage
                  src={generatedImageUrl}
                  alt={t("altGeneratedImage")}
                  width={400}
                  height={400}
                  className="rounded-md w-full h-auto"
                />
              </div>
            )}
          </div>
        )}
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={resetAndClose}>
              {t("closeButton")}
            </Button>
          </DialogClose>
          {selectedService && (
            <Button
              type="button"
              onClick={handleGenerateImage}
              disabled={
                isLoading || !prompt.trim() || cooldownSecondsRemaining > 0
              }
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {t("generateButton")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
