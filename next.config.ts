// next.config.ts
import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// 2. Inicializa el plugin (puedes pasar opciones aquí si las necesitas,
//    pero para el uso básico simplemente se llama)
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Advertencia: Ignorar errores de build de TS puede ser arriesgado en producción
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // ... otras configuraciones que tengas
};

// 3. Exporta la configuración normal de Next.js envuelta por el plugin de next-intl
export default withNextIntl(nextConfig);