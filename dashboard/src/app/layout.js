import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { NotificacionesProvider } from "@/contexts/NotificacionesContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "react-hot-toast";
import ToastNotifications from "@/components/notifications/ToastNotifications";

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
    <html lang="es" suppressHydrationWarning translate="no">
      <head>
        <meta name="google" content="notranslate" />
        <link rel="icon" href="/logo-morado.png" type="image/png" />
      </head>
      <body
        className={`${geistSans.className} ${geistMono.className} antialiased`}
        style={geistSans.style}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <AuthProvider>
            <UserProfileProvider>
              <NotificacionesProvider>
                {children}
                <ToastNotifications />
              </NotificacionesProvider>
            </UserProfileProvider>
          </AuthProvider>
          <Toaster 
            position="top-right"
            containerStyle={{
              top: 20,
              right: 20,
            }}
            toastOptions={{
              duration: 4000,
              className: 'animate-toast-slide-in',
              style: {
                background: 'white',
                color: '#1f2937',
                border: '1px solid #e5e7eb',
                padding: '14px 18px',
                borderRadius: '14px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.02)',
                fontSize: '14px',
                fontWeight: '500',
                maxWidth: '420px',
                backdropFilter: 'blur(10px)',
                animation: 'toast-slide-in 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards',
              },
              success: {
                duration: 3000,
                style: {
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  color: '#065f46',
                  border: '1px solid #86efac',
                  boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.15), 0 10px 10px -5px rgba(16, 185, 129, 0.08)',
                },
                iconTheme: {
                  primary: '#10b981',
                  secondary: 'white',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                  color: '#991b1b',
                  border: '1px solid #fca5a5',
                  boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.15), 0 10px 10px -5px rgba(239, 68, 68, 0.08)',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: 'white',
                },
              },
              loading: {
                style: {
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  color: '#1e40af',
                  border: '1px solid #93c5fd',
                  boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.15), 0 10px 10px -5px rgba(59, 130, 246, 0.08)',
                },
                iconTheme: {
                  primary: '#3b82f6',
                  secondary: 'white',
                },
              },
            }}
          />
        </ErrorBoundary>
      </body>
    </html>
  );
}
