"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GEMINI_API_KEY_INFO_URL } from "@/constants/constants";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface ApiKeyInfoStepProps {
  onGoBackToInput: () => void;
  // Opcional: pasar enlace específico si se quiere más flexibilidad
  geminiLink?: string;
}

export default function ApiKeyInfoStep({
  onGoBackToInput,
  geminiLink,
}: ApiKeyInfoStepProps) {
  const t = useTranslations("OnboardingAssistant.ApiKeyInfoStep");
  const linkToGemini = geminiLink || GEMINI_API_KEY_INFO_URL;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          {t.rich("step1", {
            link: (chunks) => (
              <Link
                href={linkToGemini}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
        <p>{t("step2")}</p>
        <p>{t("step3")}</p>
        <div className="pt-2">
          <h4 className="font-semibold">{t("securityBestPracticesTitle")}</h4>
          <ul className="list-disc space-y-1 pl-5 mt-1 text-sm text-muted-foreground">
            <li>{t("practice1")}</li>
            <li>{t("practice2")}</li>
            <li>{t("practice3", { appName: "AegisPad" })}</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onGoBackToInput} className="w-full">
          {t("backToInputButton")}
        </Button>
      </CardFooter>
    </Card>
  );
}
