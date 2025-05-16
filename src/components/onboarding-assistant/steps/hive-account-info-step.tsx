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
import { HIVE_KEYCHAIN_INSTALL_URL } from "@/constants/constants"; // Asumiendo que tienes HIVE_KEYCHAIN_WEBSITE_URL también
import { useTranslations } from "next-intl";
import Link from "next/link";

interface HiveAccountInfoStepProps {
  onGoBackToLogin: () => void;
  // Opcional: pasar enlaces específicos si se quiere más flexibilidad
  // links?: { label: string; url: string }[];
}

export default function HiveAccountInfoStep({
  onGoBackToLogin,
}: // links,
HiveAccountInfoStepProps) {
  const t = useTranslations("OnboardingAssistant.HiveAccountInfoStep");

  // Enlaces por defecto si no se pasan como props
  const defaultLinks = [
    { labelKey: "createAccountEcency", url: "https://ecency.com/signup" },
    {
      labelKey: "createAccountHiveOnboard",
      url: "https://hiveonboard.com/create-account",
    },
    { labelKey: "installKeychain", url: HIVE_KEYCHAIN_INSTALL_URL },
    // Podrías añadir un enlace al sitio web de Hive.io si lo deseas
    // { labelKey: "learnMoreHive", url: "https://hive.io/about/" },
  ];

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>{t("infoText")}</p>
        <ul className="list-disc space-y-2 pl-5">
          {defaultLinks.map((linkInfo) => (
            <li key={linkInfo.url}>
              <Link
                href={linkInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                {t(linkInfo.labelKey as any)}{" "}
                {/* Usar 'as any' temporalmente si las claves no están estrictamente tipadas en IntlMessages */}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button onClick={onGoBackToLogin} className="w-full">
          {t("backToLoginButton")}
        </Button>
      </CardFooter>
    </Card>
  );
}
