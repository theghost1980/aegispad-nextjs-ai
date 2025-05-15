"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SearchCheck } from "lucide-react";
import type { FC } from "react";

interface DetectedLanguageInfoProps {
  detectedLanguage: string | null; // Puede ser null si aún no se ha detectado
  t: (
    key: keyof IntlMessages["ArticleForgePage"]["detectLanguageCard"],
    values?: Record<string, any>
  ) => string;
}

const DetectedLanguageInfo: FC<DetectedLanguageInfoProps> = ({
  detectedLanguage,
  t,
}) => {
  if (!detectedLanguage) return null; // No renderizar nada si no hay idioma detectado

  return (
    <Card className="shadow-lg max-w-3xl mx-auto">
      <CardContent className="p-4">
        <div className="flex items-center text-sm">
          <SearchCheck className="mr-2 h-5 w-5 text-green-600" />
          <span>
            {t("detectedLanguageLabel")} <strong>{detectedLanguage}</strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetectedLanguageInfo;
