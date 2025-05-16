"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/routing"; // Usar hooks de next-intl/routing
import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export default function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const onSelectChange = (newLocale: string) => {
    // La forma recomendada de cambiar de locale con next-intl/navigation
    router.push(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-5 w-5 text-muted-foreground" />
      <Select value={locale} onValueChange={onSelectChange}>
        <SelectTrigger className="w-[120px] text-sm">
          <SelectValue placeholder={t("selectLanguage")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">{t("english")}</SelectItem>
          <SelectItem value="es">{t("spanish")}</SelectItem>
          <SelectItem value="fr">{t("french")}</SelectItem>
          <SelectItem value="pt-BR">{t("portugueseBrazil")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
