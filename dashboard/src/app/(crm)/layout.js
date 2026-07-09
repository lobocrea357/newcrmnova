"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { useAuthRequired } from "@/hooks/useRouteGuard";
import { RankingProvider } from "@/contexts/RankingContext";
import ToastContainer from "@/components/ui/ToastContainer";
import { useMetaNotifications } from "@/hooks/useMetaNotifications";
import { useUserProfile } from "@/contexts/UserProfileContext";

export default function CRMLayout({ children }) {
  const { loading, isAuthenticated } = useAuthRequired();
  const { role, isSupervisor, profileLoading } = useUserProfile();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirigir al supervisor si intenta acceder a rutas fuera de /other
  useEffect(() => {
    if (profileLoading || !isAuthenticated || !isSupervisor) return;
    const isOtherRoute = pathname === '/other' || pathname.startsWith('/other/');
    if (!isOtherRoute) {
      router.push('/other/conversaciones');
    }
  }, [profileLoading, isAuthenticated, isSupervisor, pathname, router]);

  // NUEVO: Activar sistema de notificaciones de metas
  useMetaNotifications();

  // Mientras verificamos la sesión o si no está autenticado (se redirige desde el hook)
  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <RankingProvider>
      <div className="min-h-screen overflow-x-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div
          className={`transition-all duration-300 ${
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          <Navbar
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main>{children}</main>
        </div>
      </div>
      {/* Toasts específicos del CRM */}
      <ToastContainer />
    </RankingProvider>
  );
}
