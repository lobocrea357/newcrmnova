'use client';

import { useRouteGuard } from '@/hooks/useRouteGuard';
import { useUserProfile } from '@/contexts/UserProfileContext';

export default function OtherLayout({ children }) {
  // Solo el rol supervisor (o super_admin) puede acceder al dashboard other
  const { loading } = useRouteGuard({
    requireAuth: true,
    allowedRoles: ['supervisor', 'super_admin'],
  });

  const { profileLoading } = useUserProfile();

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
