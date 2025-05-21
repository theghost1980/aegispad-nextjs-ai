import CustomButton from "@/components/custom-button"; // Importar el nuevo CustomButton
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Button ya no se usa aquí
import { BarChart3, Edit3, KeyRound, Languages, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "HomePage" });

  const features = [
    {
      icon: <Edit3 className="h-10 w-10 text-primary mb-4" />,
      title: t("feature2Title"),
      description: t("feature2Description"),
    },
    {
      icon: <Languages className="h-10 w-10 text-primary mb-4" />,
      title: t("feature3Title"),
      description: t("feature3Description"),
    },
  ];

  return (
    <div className="space-y-16 md:space-y-24">
      <section className="text-center pt-12 md:pt-16 pb-12 md:pb-16 bg-black/50 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center bg-no-repeat text-white relative overflow-hidden">
        {" "}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
          {t("heroTitle")}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          {t("heroSubtitle")}
        </p>{" "}
        <CustomButton href="/editor">{t("heroCtaButton")}</CustomButton>
      </section>

      <section className="py-16 md:py-20 bg-muted/50">
        {" "}
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {t("featuresTitle")}
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <CardHeader className="items-center">
                {feature.icon}
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-card py-16 md:py-20 rounded-lg shadow-lg">
        {" "}
        <div className="container mx-auto text-center">
          <KeyRound className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t("geminiApiTitle")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-4">
            {t("geminiApiIntro")}
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-4">
            {t.rich("geminiApiGetFree", {
              link: (chunks) => (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
          <div className="mt-8 bg-primary/10 text-primary p-6 rounded-lg inline-flex items-center gap-3 max-w-2xl mx-auto">
            <Zap className="h-8 w-8 flex-shrink-0" />
            <p className="text-left font-medium text-lg">
              {t("geminiApiFreeTier")}
            </p>
          </div>
        </div>
      </section>

      <section className="text-center py-12">
        <CustomButton href="/editor" variant="outline">
          {t("secondaryCtaButton")}
        </CustomButton>
      </section>

      <section className="py-12 md:py-16 bg-background">
        {" "}
        <div className="container mx-auto text-center">
          <BarChart3 className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t("tokenEstimationTitle")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            {t("tokenEstimationIntro")}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("tokenEstimationReviseTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t("tokenEstimationReviseDesc")}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("tokenEstimationTranslateTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t("tokenEstimationTranslateDesc")}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("tokenEstimationImageTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t("tokenEstimationImageDesc")}
                </p>
              </CardContent>
            </Card>
          </div>
          <p className="mt-10 text-lg text-muted-foreground max-w-3xl mx-auto">
            {t("tokenEstimationMonthly")}
          </p>
          <p className="mt-4 text-sm text-muted-foreground max-w-3xl mx-auto">
            <em>{t("tokenEstimationNote")}</em>
          </p>
        </div>
      </section>
    </div>
  );
}
