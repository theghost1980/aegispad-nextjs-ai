"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Edit3, Send, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

interface CompletedStepProps {
  onGetStarted?: () => void;
}

export default function CompletedStep({ onGetStarted }: CompletedStepProps) {
  const t = useTranslations("OnboardingAssistant.completed");

  return (
    <div className="space-y-6 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <h2 className="text-2xl font-semibold">{t("title")}</h2>
      <p className="text-muted-foreground">{t("description")}</p>
      <div className="text-left space-y-3 pt-4">
        <h3 className="font-semibold text-lg">{t("nextStepsTitle")}</h3>
        <ul className="list-none space-y-2">
          <li className="flex items-start">
            <Sparkles className="h-5 w-5 mr-3 mt-1 text-primary flex-shrink-0" />
            <span>
              {t.rich("step1AI", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          </li>
          <li className="flex items-start">
            <Edit3 className="h-5 w-5 mr-3 mt-1 text-primary flex-shrink-0" />
            <span>
              {t.rich("step2Manual", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          </li>
          <li className="flex items-start">
            <Send className="h-5 w-5 mr-3 mt-1 text-primary flex-shrink-0" />
            <span>
              {t.rich("step3Explore", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          </li>
        </ul>
      </div>
      {onGetStarted && (
        <Button onClick={onGetStarted} className="mt-6 w-full sm:w-auto">
          {t("getStartedButton")}
        </Button>
      )}
    </div>
  );
}
