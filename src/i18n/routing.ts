import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es"] as const,
  defaultLocale: "en" as const,
  localePrefix: {
    mode: "as-needed",
  } as const,
  pathnames: {
    "/": "/",
    "/editor": "/editor",
    "/testings": "/testings",
  } as const,
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

export const { locales, defaultLocale, localePrefix, pathnames } = routing;
