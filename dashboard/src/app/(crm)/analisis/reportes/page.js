'use client'

import UnderDevelopment from '@/components/layout/UnderDevelopment'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function ReportesPage() {
  return (
    <ProtectedRoute>
      <UnderDevelopment 
        moduleName="Modulo"
        description="Proximamente"
      />
    </ProtectedRoute>
  );
}
