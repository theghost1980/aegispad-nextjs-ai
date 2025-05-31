"use client";

import CustomButton from "@/components/custom-button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqData } from "@/constants/constants";
import { useTranslations } from "next-intl";

export interface FaqItem {
  id: string;
  questionKey: keyof IntlMessages["FaqPage"];
  answerKey: keyof IntlMessages["FaqPage"];
}

export default function FaqPage() {
  const t = useTranslations("FaqPage");

  const renderAnswer = (answerKey: keyof IntlMessages["FaqPage"]) => {
    const answerText = t(answerKey);
    const linkPlaceholder = "[devlogs_link]";

    if (answerText.includes(linkPlaceholder)) {
      const parts = answerText.split(linkPlaceholder);
      return (
        <>
          {parts[0]}
          <CustomButton
            href="/devlogs"
            className="text-primary hover:underline font-medium"
          >
            {t("devlogsLinkText")}
          </CustomButton>
          {parts[1]}
        </>
      );
    }
    return <>{answerText}</>;
  };

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">{t("title")}</h1>
      <Accordion type="single" collapsible className="w-full">
        {faqData.map((item) => (
          <AccordionItem value={item.id} key={item.id}>
            <AccordionTrigger className="text-left hover:no-underline">
              {t(item.questionKey)}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {renderAnswer(item.answerKey)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
