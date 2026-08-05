'use client'

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ManualVentasClient from "@/components/crm/ManualVentasClient";

export default function ManualVentasPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50/50 pb-20">
        <ManualVentasClient />
      </div>
    </ProtectedRoute>
  );
}
