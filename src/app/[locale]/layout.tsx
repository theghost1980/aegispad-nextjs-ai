import { locales } from "@/i18n/routing";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { Inter, Roboto_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { Suspense } from "react";
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
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  return {
    title: "AegisPad",
    description: "Create, revise, and translate articles with AI.",
  };
}

const getMessages = async (locale: string) => {
  try {
    return (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`No se encontraron mensajes para el locale: ${locale}`);
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
  const messages = await getMessages(locale);

  return (
    <html lang={locale} className={`${inter.variable} ${robotoMono.variable}`}>
      <body className="font-sans">
        <Suspense
          fallback={
            <div
              className="flex justify-center items-center min-h-screen text-xl"
              suppressHydrationWarning={true}
            >
              Cargando Layout y Contenido...
            </div>
          }
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
