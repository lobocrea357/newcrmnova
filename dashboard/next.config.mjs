/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  // Dependencias que solo se usan en el servidor (rutas app/api/*)
  serverExternalPackages: ["puppeteer", "html2canvas", "openai"],

  experimental: {
    // Optimizar imports de librerías grandes
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;
