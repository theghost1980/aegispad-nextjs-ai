// src/components/language-switcher.tsx
"use client";

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation'; // Corrected import for App Router
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from 'lucide-react';
import {locales} from '../../i18n';

export default function LanguageSwitcher() {
  const t = useTranslations('LanguageSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const onSelectChange = (newLocale: string) => {
    // Construct the new path by replacing the current locale with the new one
    // For paths like '/' or '/es', it needs careful handling.
    // Assuming localePrefix: 'as-needed', the root path might not have a locale.
    
    let newPath;
    const pathSegments = pathname.split('/');

    if (locales.includes(pathSegments[1])) {
      // Path is like /en/some/page or /es/some/page
      pathSegments[1] = newLocale;
      newPath = pathSegments.join('/');
    } else {
      // Path is like /some/page (default locale, 'as-needed') or just '/'
      // For '/some/page' -> '/<newLocale>/some/page'
      // For '/' -> '/<newLocale>'
      if (newLocale !== 'en') { // 'en' is defaultLocale, 'as-needed' means no prefix for it
         newPath = `/${newLocale}${pathname === '/' ? '' : pathname}`;
      } else {
         newPath = pathname; // If switching to default, and it was prefixed, remove prefix.
         // This part is tricky with 'as-needed'. If current path is /es/about and newLocale is 'en',
         // it should go to /about.
         if (pathname.startsWith(`/${locale}`)) {
            newPath = pathname.substring(locale.length +1) || '/';
         } else {
            newPath = pathname;
         }

      }
    }
    // Ensure newPath starts with a slash if it's not empty
    if (newPath !== '/' && !newPath.startsWith('/')) {
        newPath = '/' + newPath;
    }


    router.push(newPath);
    router.refresh(); // Recommended by next-intl to refresh server components
  };

  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-5 w-5 text-muted-foreground" />
      <Select value={locale} onValueChange={onSelectChange}>
        <SelectTrigger className="w-[120px] text-sm">
          <SelectValue placeholder={t('selectLanguage')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">{t('english')}</SelectItem>
          <SelectItem value="es">{t('spanish')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}