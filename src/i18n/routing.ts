import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";
import { allLocales, defaultLocale as appDefaultLocale } from "./config";

export const routing = defineRouting({
  locales: allLocales,
  defaultLocale: appDefaultLocale,
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
