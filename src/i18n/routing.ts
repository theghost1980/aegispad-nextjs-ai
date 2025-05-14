import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'es'] as const,
  defaultLocale: 'en' as const,
  localePrefix: {
    mode: 'as-needed',
  } as const,
   pathnames: {
    '/': '/', 
    '/editor': '/editor'
  } as const
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

export const { locales, defaultLocale, localePrefix, pathnames } = routing;