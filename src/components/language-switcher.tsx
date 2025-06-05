"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { localeDetails } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export default function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const onSelectChange = (newLocale: string) => {
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
          {localeDetails.map((detail) => (
            <SelectItem key={detail.code} value={detail.code}>
              {t(detail.nameKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
