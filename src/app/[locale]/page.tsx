import CustomButton from "@/components/custom-button";
import { FeaturesCarousel } from "@/components/custom/FeaturesCarousel";
import { Edit3, Languages, Mic, Users } from "lucide-react";
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
    {
      icon: <Mic className="h-10 w-10 text-primary mb-4" />,
      title: t("featureVoiceTitle"),
      description: t("featureVoiceDescription"),
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
        <div className="w-full max-w-xl mx-auto px-4 md:px-0">
          <FeaturesCarousel features={features} />
        </div>
      </section>

      <section className="text-center py-12">
        <CustomButton
          href="/editor"
          variant="primary"
          className="px-8 py-3 text-lg transform hover:scale-105 transition-transform duration-200 ease-in-out shadow-lg hover:shadow-primary/50"
        >
          {t("secondaryCtaButton")}
        </CustomButton>
      </section>

      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto text-center">
          <Users className="h-12 w-12 text-primary mx-auto mb-6" />{" "}
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t("visionTitle")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            {t("visionIntro")}
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-4">
            {t("visionBeneficiary")}
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            {t.rich("visionFeedbackLink", {
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
          <p className="text-md text-muted-foreground/80 max-w-2xl mx-auto">
            {t("visionHiveReminder")}
          </p>
        </div>
      </section>
    </div>
  );
}
