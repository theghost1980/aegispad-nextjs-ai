import { locales } from "@/i18n/routing";
import fs from "fs/promises";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import path from "path";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

async function getDevlogContent(): Promise<string> {
  const filePath = path.join(process.cwd(), "DEVLOGS.md");
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error("Error al leer DEVLOGS.md:", error);
    notFound();
  }
}

export type DevlogPageParamProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: DevlogPageParamProps) {
  const { locale } = await params;
  if (!locales.includes(locale as any)) {
    notFound();
  }

  try {
    const t = await getTranslations({ locale, namespace: "DevlogsPage" });
    return {
      title: `${t("metaTitle")} | AegisPad`,
      description: t("metaDescription"),
    };
  } catch (error) {
    return {
      title: "Devlogs | AegisPad",
      description: "Historial de desarrollo del proyecto AegisPad.",
    };
  }
}

export default async function DevlogsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "DevlogsPage" });
  const markdownContent = await getDevlogContent();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-center">
        {t("title")}
      </h1>
      <article className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {markdownContent}
        </ReactMarkdown>
      </article>
    </div>
  );
}
