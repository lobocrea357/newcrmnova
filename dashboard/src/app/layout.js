import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { NotificacionesProvider } from "@/contexts/NotificacionesContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "react-hot-toast";
import ToastNotifications from "@/components/notifications/ToastNotifications";

// Fuente autoalojada (el build en Docker no puede descargar Google Fonts).
import "@fontsource-variable/onest";

export const metadata = {
  title: "CRM Viajes Nova",
  description: "Conversaciones, ventas y calidad del equipo de Viajes Nova",
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
      <body className="font-sans antialiased" suppressHydrationWarning>
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
              style: {
                background: '#fff',
                color: 'var(--color-tinta)',
                border: '1px solid var(--color-linea)',
                borderLeft: '3px solid var(--color-nova-600)',
                padding: '12px 16px',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-lg)',
                fontSize: '14px',
                fontWeight: '500',
                maxWidth: '420px',
                animation: 'toast-slide-in 0.3s cubic-bezier(0.21, 1.02, 0.73, 1) forwards',
              },
              success: {
                duration: 3000,
                style: { borderLeftColor: 'var(--color-green-600)' },
                iconTheme: { primary: 'var(--color-green-600)', secondary: '#fff' },
              },
              error: {
                duration: 5000,
                style: { borderLeftColor: 'var(--color-red-600)' },
                iconTheme: { primary: 'var(--color-red-600)', secondary: '#fff' },
              },
              loading: {
                iconTheme: { primary: 'var(--color-nova-600)', secondary: '#fff' },
              },
            }}
          />
        </ErrorBoundary>
      </body>
    </html>
  );
}
