import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { notFound } from 'next/navigation';

export default getRequestConfig(async ({
  requestLocale
}) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
   };
 });