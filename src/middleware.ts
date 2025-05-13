import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed' // Strategy: /about vs /es/about
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(en|es)/:path*']
};