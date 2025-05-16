"use client";

import AegisPadLogoIcon from "@/components/aegis-pad-logo-icon";
import CustomButton from "@/components/custom-button"; // Importar CustomButton
import LanguageSwitcher from "@/components/language-switcher";
import { Link, usePathname } from "@/i18n/routing"; // Usar Link y usePathname de tu configuración de routing
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl"; // useTranslations también es de next-intl (sin /client)
// import { Menu as MenuIcon } from "lucide-react"; // Para el menú móvil
// import { Button } from "@/components/ui/button"; // Para el menú móvil
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Para el menú móvil

interface NavItem {
  labelKey: keyof IntlMessages["Header"];
  href: string;
}

const navItems: NavItem[] = [
  { labelKey: "navHome", href: "/" },
  { labelKey: "navEditor", href: "/editor" },
  { labelKey: "navTestings", href: "/testings" },
  { labelKey: "navFaq", href: "/faq" },
];

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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 flex-1">
          {navItems.map((item) => (
            <CustomButton
              key={item.href}
              href={item.href}
              variant="outline" // O la variante por defecto que quieras para los enlaces del header
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                // Aplicar estilo de texto activo
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {t(item.labelKey)}
            </CustomButton>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <LanguageSwitcher />
          {/* Placeholder for Mobile Menu Button */}
        </div>
      </div>
    </header>
  );
}
