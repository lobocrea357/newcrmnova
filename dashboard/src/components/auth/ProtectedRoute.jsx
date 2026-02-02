"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserInfo, isRouteHidden } from "@/lib/userConfig";
import { Loader2 } from "lucide-react";

/**
 * Componente para proteger rutas según permisos de usuario
 * Redirige a /no-autorizado si el usuario no tiene acceso
 */
export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [pathname]);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Si no hay usuario, redirigir a login
        router.push("/login");
        return;
      }

      // Verificar si la ruta actual está oculta para este usuario
      const hidden = isRouteHidden(user.email, pathname);

      if (hidden) {
        // Ruta no permitida, redirigir a página de no autorizado
        router.push("/no-autorizado");
        return;
      }

      // Usuario autorizado
      setAuthorized(true);
    } catch (error) {
      console.error("Error verificando acceso:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null; // Se está redirigiendo
  }

  return <>{children}</>;
}
