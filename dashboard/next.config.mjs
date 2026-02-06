/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,

  // Optimizaciones para el Sistema de Análisis de Ventas
  experimental: {
    // Excluir dependencias del servidor de los bundles del cliente
    serverComponentsExternalPackages: [
      "node-cron",
      "puppeteer",
      "html2canvas",
      "openai",
    ],
    // Optimizar imports de librerías grandes
    optimizePackageImports: ["lucide-react", "recharts"],
  },

  // Configuración para APIs de larga duración (análisis IA)
  api: {
    responseLimit: false,
    externalResolver: true,
  },

  // Optimizaciones de build
  swcMinify: true,

  // Headers de seguridad
  async headers() {
    return [
      {
        source: "/api/cron/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },

  // Configuración para el sistema de cron en producción
  env: {
    CRON_ENABLED:
      process.env.NODE_ENV === "production"
        ? "true"
        : process.env.ENABLE_CRON_IN_DEV || "false",
  },
};

export default nextConfig;
