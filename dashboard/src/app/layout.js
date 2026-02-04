import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Auto-inicializar sistema de cron solo en servidor
if (typeof window === "undefined") {
  // Importar dinámicamente para evitar problemas en el cliente
  import("../lib/cronInitializer").then(({ autoInitialize }) => {
    autoInitialize().catch(console.error);
  });
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CRM WhatsApp - Dashboard",
  description: "Dashboard para gestión de bots de WhatsApp con WAHA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
