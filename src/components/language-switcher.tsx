"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { locales } from "../i18n/routing";

export default function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const onSelectChange = (newLocale: string) => {
    let newPath;
    const pathSegments = pathname.split("/");

    if (locales.includes(pathSegments[1] as any)) {
      pathSegments[1] = newLocale;
      newPath = pathSegments.join("/");
    } else {
      if (newLocale !== "en") {
        newPath = `/${newLocale}${pathname === "/" ? "" : pathname}`;
      } else {
        newPath = pathname;
        if (pathname.startsWith(`/${locale}`)) {
          newPath = pathname.substring(locale.length + 1) || "/";
        } else {
          newPath = pathname;
        }
      }
    }
    if (newPath !== "/" && !newPath.startsWith("/")) {
      newPath = "/" + newPath;
    }

    router.push(newPath);
    router.refresh();
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
        </SelectContent>
      </Select>
    </div>
  );
}
