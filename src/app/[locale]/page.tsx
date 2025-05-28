import CustomButton from "@/components/custom-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit3, Languages, Users } from "lucide-react";
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
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-center mb-12">
          {t("featuresIntro")}
        </p>
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

      <section className="text-center py-12">
        <CustomButton
          href="/editor"
          variant="primary" // Cambiar a 'primary' para más énfasis
          className="px-8 py-3 text-lg transform hover:scale-105 transition-transform duration-200 ease-in-out shadow-lg hover:shadow-primary/50" // Clases para hacerlo más grande y con efectos
        >
          {t("secondaryCtaButton")}
        </CustomButton>
      </section>

      {/* Nueva Sección: Nuestra Visión y Comunidad */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto text-center">
          <Users className="h-12 w-12 text-primary mx-auto mb-6" />{" "}
          {/* Icono sugerido */}
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t("visionTitle")} {/* Nueva clave de traducción */}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            {t("visionIntro")} {/* Nueva clave de traducción */}
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-4">
            {t("visionBeneficiary")} {/* Nueva clave de traducción */}
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            {t.rich("visionFeedbackLink", {
              // Para el enlace de feedback
              link: (chunks) => (
                <CustomButton
                  href="/feedback"
                  variant="outline"
                  className="inline-block ml-1 text-base"
                >
                  {chunks}
                </CustomButton>
              ),
            })}
          </p>
          {/* Opcional: Pequeño recordatorio sobre Hive */}
          <p className="text-md text-muted-foreground/80 max-w-2xl mx-auto">
            {t("visionHiveReminder")} {/* Nueva clave de traducción */}
          </p>
        </div>
      </section>
    </div>
  );
}
