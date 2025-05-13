
import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google'; // Changed to actual Google Fonts
import '../globals.css'; // Adjusted path
import Header from '@/components/header';
import { Toaster } from "@/components/ui/toaster";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations} from 'next-intl/server';
import LanguageSwitcher from '@/components/language-switcher';

const inter = Inter({ 
  variable: '--font-inter', // Updated variable name
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({ 
  variable: '--font-roboto-mono', // Updated variable name
  subsets: ['latin'],
  weight: ['400', '700'] // Common weights for Roboto Mono
});

export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  // Assuming you have a 'Layout.title' and 'Layout.description' in your message files
  // For simplicity, using fixed values now, but you can fetch them:
  // const t = await getTranslations({locale, namespace: 'Layout'});
  // title: t('title'),
  // description: t('description')
  return {
    title: 'ArticleForge AI',
    description: 'Create, revise, and translate articles with AI.',
  };
}

export default async function RootLayout({
  children,
  params: {locale}
}: Readonly<{
  children: React.ReactNode;
  params: {locale: string};
}>) {
  const messages = await getMessages();
  const t = await getTranslations({locale, namespace: 'Layout'});
  const tHeader = await getTranslations({locale, namespace: 'Header'});

  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${robotoMono.variable} antialiased flex flex-col min-h-screen`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header title={tHeader('appName')} />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Toaster />
          <footer className="bg-card border-t border-border py-4 text-center text-sm text-muted-foreground">
            {t('footerCopyright', {year: new Date().getFullYear()})}
            <div className="mt-2">
              <LanguageSwitcher />
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
