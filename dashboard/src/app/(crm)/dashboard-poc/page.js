"use client";

import { useEffect } from "react";
import { Users } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import LeadsDashboard from "@/components/poc/LeadsDashboard";

export default function DashboardPoCPage() {
  const { isSuperAdmin, loading: authLoading, profile } = useUserProfile();

  useEffect(() => {
    if (!authLoading && profile && !isSuperAdmin) {
      window.location.href = '/no-autorizado';
    }
  }, [isSuperAdmin, authLoading, profile]);

  if (authLoading || !isSuperAdmin || !profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-lg">
              <Users className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold">Dashboard de Leads POC</h1>
          </div>
          <p className="text-purple-100 text-lg">
            Estadísticas y gestión de leads del sistema de eventos
          </p>
          <p className="text-purple-200 text-sm mt-1">
            🔒 Solo visible para Super Admins • Sistema aislado sin afectar producción
          </p>
        </div>

        <LeadsDashboard />
      </div>
    </div>
  );
}
