
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
    // The path `./messages/${locale}.json` is relative to `src/i18n.ts`
    // and should correctly resolve to `src/messages/${locale}.json`.
    // The `.default` is used as per next-intl documentation for JSON files.
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Could not load messages for locale "${locale}":`, error);
    notFound();
  }

  if (!messages) {
    // This case handles if the import succeeded but messages ended up undefined (e.g. malformed JSON or incorrect .default usage if bundler behaves differently)
    console.error(`Messages for locale "${locale}" resolved to undefined, null, or empty after import.`);
    notFound();
  }
 
  return {
    messages
  };
});

