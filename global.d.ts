import { routing } from './src/i18n/routing';
import messages from './src/messages/en.json';

declare module 'next-intl' {
  interface AppConfig {
    locales: (typeof routing.locales)[number];
    messages: typeof messages;
  }
}