import Header from "@/components/header";
import { PostHogProvider } from "@/components/PostHogProvider";
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from "@/context/app-context";
import { ThemeProvider } from "@/context/theme-context";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Inter, Roboto_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { locales } from "../../i18n/routing";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export type ParamProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: ParamProps): Promise<Metadata> {
  console.log("generateMetadata: Iniciando...");
  const { locale } = await params;
  console.log(`generateMetadata: Locale obtenido: ${locale}`);

  if (!locales.includes(locale as any)) {
    notFound();
  }

  return {
    title: "AegisPad",
    description: "All in one suite Editor for HIVE using AI.",
  };
}

const getMessages = async (locale: string) => {
  try {
    console.log(
      `getMessages: Intentando cargar mensajes para locale: ${locale}`
    );
    return (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    console.error(
      `getMessages: Error al cargar mensajes para locale "${locale}":`,
      error
    );
    return {};
  }
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locale) {
    console.error(
      "RootLayout: El locale obtenido de params es undefined o null. Esto es un problema."
    );
    notFound();
  }

  if (!locales.includes(locale as any)) {
    console.error(
      `RootLayout: Locale "${locale}" no está en la lista de locales válidos. Llamando a notFound().`
    );
    notFound();
  }
  const messages = await getMessages(locale);
  const t = await getTranslations({ locale, namespace: "Layout" });

  return (
    <html lang={locale}>
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <PostHogProvider>
          <ThemeProvider defaultTheme={"system"} storageKey={"aegispad-theme"}>
            <AppProvider>
              <NextIntlClientProvider locale={locale} messages={messages}>
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8">
                  {children}
                </main>
                <Toaster />
                <footer className="bg-card border-t border-border py-4 text-center text-sm text-muted-foreground">
                  {t("footerCopyright", { year: new Date().getFullYear() })}
                </footer>
              </NextIntlClientProvider>
            </AppProvider>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
