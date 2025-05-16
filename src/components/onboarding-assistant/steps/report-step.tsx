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
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Copy, PartyPopper } from "lucide-react";
import { useTranslations } from "next-intl";

interface ReportStepProps {
  reportDate: string;
  hiveUsername: string;
  apiKeyStatus: string;
  onComplete: () => void;
}

export default function ReportStep({
  reportDate,
  hiveUsername,
  apiKeyStatus,
  onComplete,
}: ReportStepProps) {
  const t = useTranslations("OnboardingAssistant.ReportStep");
  const tToast = useTranslations("ArticleForgePage.toastMessages"); // Reutilizar toasts
  const { toast } = useToast();

  const reportText = `
${t("reportTitle")}
-----------------------------------
${t("configDateLabel")}: ${reportDate}
${t("hiveUsernameLabel")}: @${hiveUsername}
${t("apiKeyStatusLabel")}: ${apiKeyStatus}
-----------------------------------
${t("recommendation")}
  `.trim();

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      toast({
        title: tToast("successTitle"),
        description: t("copySuccessMessage"),
      });
    } catch (err) {
      console.error("Failed to copy report: ", err);
      toast({
        title: tToast("errorTitle"),
        description: t("copyFailedMessage"),
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="items-center text-center">
        <PartyPopper className="h-12 w-12 text-green-500 mb-2" />
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>
          <span className="font-semibold">{t("configDateLabel")}:</span>{" "}
          {reportDate}
        </p>
        <p>
          <span className="font-semibold">{t("hiveUsernameLabel")}:</span> @
          {hiveUsername}
        </p>
        <p>
          <span className="font-semibold">{t("apiKeyStatusLabel")}:</span>{" "}
          {apiKeyStatus}
        </p>
        <p className="pt-2 text-xs text-muted-foreground">
          {t("recommendation")}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleCopyReport}
          variant="outline"
          className="w-full sm:w-auto flex-1"
        >
          <Copy className="mr-2 h-4 w-4" /> {t("copyReportButton")}
        </Button>
        <Button onClick={onComplete} className="w-full sm:w-auto flex-1">
          <CheckCircle className="mr-2 h-4 w-4" /> {t("completeButton")}
        </Button>
      </CardFooter>
    </Card>
  );
}
