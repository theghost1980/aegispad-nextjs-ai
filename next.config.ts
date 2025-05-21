import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// PostHog configuration
const POSTHOG_INGESTION_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const POSTHOG_ASSETS_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_ASSETS_HOST ||
  "https://us-assets.i.posthog.com";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Advertencia: Ignorar errores de build de TS puede ser arriesgado en producción
    // TODO: Consider removing this and fixing TypeScript errors before production deployment.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      // PostHog specific rewrites - ensure more specific paths come first
      {
        source: "/ingest/decide",
        destination: `${POSTHOG_INGESTION_HOST}/decide`,
      },
      {
        source: "/ingest/static/:path*",
        destination: `${POSTHOG_ASSETS_HOST}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${POSTHOG_INGESTION_HOST}/:path*`,
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default withNextIntl(nextConfig);
