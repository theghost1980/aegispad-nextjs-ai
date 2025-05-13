
// i18n.ts
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server'; // Importa correctamente desde '/server'

// Define los idiomas soportados por tu aplicación
const locales = ['en', 'es']; // Usamos 'const' para mayor seguridad de tipos

export const defaultLocale = 'en'; // Exporta también el idioma por defecto si lo necesitas en otro lugar

export default getRequestConfig(async ({ locale }) => {
  
  if (!locales.includes(locale as any)) { // Puedes necesitar un 'as any' o asegurar el tipo de 'locale' si TS se queja
    notFound();
  }

  // Carga dinámicamente los mensajes para el idioma solicitado
  // Asegúrate de tener tus archivos de mensajes en la estructura correcta, ej: messages/en.json, messages/es.json
  return {
    messages: (await import(`./src/messages/${locale}.json`)).default
  };
});

// Si necesitas exportar la lista de locales en algún otro lugar:
export { locales };


