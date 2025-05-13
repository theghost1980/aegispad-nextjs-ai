
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Can be imported from a shared config
export const locales = ['en', 'es'];
export const defaultLocale = 'en';
 
export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }
 
  let messages;
  try {
    // Using relative path from src/i18n.ts to src/messages/
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Could not load messages for locale "${locale}" from "./messages/${locale}.json":`, error);
    notFound();
  }

  if (!messages) {
    // This case handles if the import succeeded but messages ended up undefined
    console.error(`Messages for locale "${locale}" (loaded from "./messages/${locale}.json") resolved to undefined, null, or empty after import.`);
    notFound();
  }
 
  return {
    messages
  };
});


