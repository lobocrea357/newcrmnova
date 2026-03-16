import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "react-hot-toast";

// Auto-inicializar sistema de cron solo en servidor
if (typeof window === "undefined") {
  // Importar dinámicamente para evitar problemas en el cliente
  import("../lib/cronInitializer").then(({ autoInitialize }) => {
    autoInitialize().catch(console.error);
  });
}

// Usar system fonts en lugar de Google Fonts para evitar errores en Docker
const geistSans = {
  className: "font-sans",
  style: { fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }
};

const geistMono = {
  className: "font-mono",
  style: { fontFamily: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace" }
};

export const metadata = {
  title: "CRM WhatsApp - Dashboard",
  description: "Dashboard para gestión de bots de WhatsApp con WAHA",
  icons: {
    icon: '/logo-morado.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo-morado.png" type="image/png" />
      </head>
      <body
        className={`${geistSans.className} ${geistMono.className} antialiased`}
        style={geistSans.style}
      >
        <ErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </ErrorBoundary>
      </body>
    </html>
  );
}
