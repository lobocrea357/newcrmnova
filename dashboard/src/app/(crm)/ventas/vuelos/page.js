'use client'

import UnderDevelopment from "@/components/layout/UnderDevelopment";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function VuelosPage() {
  return (
    <ProtectedRoute>
      <div>
        <UnderDevelopment 
          moduleName="Modulo"
          description="Proximamente"
        />
      </div>
    </ProtectedRoute>
  );
}
