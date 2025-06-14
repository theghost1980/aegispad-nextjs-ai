import { routing } from "./src/i18n/routing";
import type messagesType from "./src/messages/en-US.json";
import messages from "./src/messages/en-US.json";

declare module "next-intl" {
  interface AppConfig {
    locales: (typeof routing.locales)[number];
    messages: typeof messages;
  }
}

type Messages = typeof messagesType;
declare global {
  interface IntlMessages extends Messages {}
}
