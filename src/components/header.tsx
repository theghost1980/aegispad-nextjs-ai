"use client";

import AegisPadLogoIcon from "@/components/aegis-pad-logo-icon";
import CustomButton from "@/components/custom-button"; // Importar CustomButton
import LanguageSwitcher from "@/components/language-switcher";
import { UserAvatarDropdown } from "@/components/user-avatar-dropdown";
import { Link, usePathname } from "@/i18n/routing"; // Usar Link y usePathname de tu configuración de routing
import { cn } from "@/lib/utils"; // Para combinar clases opcionales
import { MessageSquarePlus } from "lucide-react";
import { useTranslations } from "next-intl"; // useTranslations también es de next-intl (sin /client)
// import { Menu as MenuIcon } from "lucide-react"; // Para el menú móvil
// import { Button } from "@/components/ui/button"; // Para el menú móvil
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Para el menú móvil

interface NavItem {
  labelKey: keyof IntlMessages["Header"];
  icon?: React.ElementType;
  isIconButton?: boolean;
  href: string;
}

const navItems: NavItem[] = [
  { labelKey: "navHome", href: "/" },
  { labelKey: "navEditor", href: "/editor" },
  // { labelKey: "navTestings", href: "/testings" },
  { labelKey: "navFaq", href: "/faq" },
];

const feedbackNavItem: NavItem = {
  labelKey: "navFeedback",
  href: "/feedback",
  isIconButton: true,
};

export default function Header() {
  const t = useTranslations("Header");
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <AegisPadLogoIcon className="h-12 w-12" />
          <span className="font-bold sm:inline-block">{t("appName")}</span>
        </Link>

        <nav className="hidden md:flex gap-6 flex-1">
          {navItems.map((item) => (
            <CustomButton
              key={item.labelKey}
              href={item.href}
              variant="outline"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {t(item.labelKey)}
            </CustomButton>
          ))}

          <CustomButton
            href={feedbackNavItem.href}
            variant="outline"
            className={cn(
              "p-2 transition-colors hover:text-primary",
              pathname === feedbackNavItem.href
                ? "text-primary border-primary"
                : "text-muted-foreground"
            )}
            aria-label={t("feedbackButtonAriaLabel")}
            title={t(feedbackNavItem.labelKey)}
          >
            <MessageSquarePlus className="h-5 w-5" />
          </CustomButton>
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <LanguageSwitcher />
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <UserAvatarDropdown />
        </div>
      </div>
    </header>
  );
}
