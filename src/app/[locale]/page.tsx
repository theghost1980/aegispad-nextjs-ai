import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import NextLink from "next/link";

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "HomePage" });

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-center">{t("description")}</p>
          <div className="flex justify-center">
            <NextLink href={`/${locale}/editor`} className="btn btn-primary">
              {t("goToEditorButton")}
            </NextLink>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {t("additionalInfo")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
