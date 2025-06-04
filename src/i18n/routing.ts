import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

//TODO while adding new features to keep just english
// locales: ["en", "es", "fr", "pt-BR"] as const,  ORIGINAL to add translations after feature addition

export const routing = defineRouting({
  locales: ["en", "es"] as const,
  defaultLocale: "en" as const,
  localePrefix: {
    mode: "as-needed",
  } as const,
  pathnames: {
    "/": "/",
    "/editor": "/editor",
    "/faq": "/faq",
    "/profile": "/profile",
    "/login": "/login",
    "/devlogs": "/devlogs",
  } as const,
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

export const { locales, defaultLocale, localePrefix, pathnames } = routing;
