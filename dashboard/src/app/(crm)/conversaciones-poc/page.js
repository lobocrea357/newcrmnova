"use client";

import { useState, useEffect } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Users, MessageSquare, ArrowRight, RefreshCw, TrendingUp } from "lucide-react";
import ThreadRow from "@/components/poc/ThreadRow";
import { POC_API } from "@/config/apiConfig";

export default function ConversacionesPoCPage() {
  const { isSuperAdmin, loading: authLoading, role, profile } = useUserProfile();
  const [threads, setThreads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // IMPORTANTE: Solo evaluar acceso si el perfil ha cargado completamente
    const profileLoaded = profile !== null;

    if (!authLoading && profileLoaded && !isSuperAdmin) {
      window.location.href = '/no-autorizado';
    }
  }, [isSuperAdmin, authLoading, role, profile]);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const response = await fetch(POC_API.threads(100));
      if (!response.ok) throw new Error('Error fetching threads');

      const { data } = await response.json();
      setThreads(data || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(POC_API.threadsStats);
      if (!response.ok) throw new Error('Error fetching stats');

      const { data } = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchThreads();
      fetchStats();
    }
  }, [isSuperAdmin]);

  if (authLoading || !isSuperAdmin || !profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Users className="h-8 w-8" />
                </div>
                <h1 className="text-4xl font-bold">PoC: Thread Global por Cliente</h1>
              </div>
              <p className="text-purple-100 text-lg">
                Sincronización automática incremental en tiempo real
              </p>
              <p className="text-purple-200 text-sm mt-1">
                🔒 Solo visible para Super Admins • Sistema aislado sin afectar producción
              </p>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2 text-white">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Sincronización automática via webhook</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
              <div className="flex items-center gap-3">
                <Users className="h-10 w-10 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-500 font-medium">Threads Totales</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-500">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-10 w-10 text-amber-600" />
                <div>
                  <p className="text-sm text-gray-500 font-medium">Con Fragmentación</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.fragmented}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-rose-500">
              <div className="flex items-center gap-3">
                <ArrowRight className="h-10 w-10 text-rose-600" />
                <div>
                  <p className="text-sm text-gray-500 font-medium">Reasignaciones</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.reassignments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-10 w-10 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500 font-medium">Tasa Fragmentación</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.fragmentation_rate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Threads List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-white">
            <h2 className="text-2xl font-bold text-gray-900">Conversaciones Unificadas</h2>
            <p className="text-sm text-gray-600 mt-1">
              Vista comparativa: sistema actual (fragmentado) vs. threads (unificado)
            </p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-16 text-center">
                <RefreshCw className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Cargando threads...</p>
              </div>
            ) : threads.length === 0 ? (
              <div className="p-16 text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No hay threads sincronizados</p>
                <p className="text-sm text-gray-400">
                  Los threads se crearán automáticamente cuando lleguen nuevos mensajes
                </p>
              </div>
            ) : (
              threads.map(thread => (
                <ThreadRow key={thread.id} thread={thread} />
              ))
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información del PoC</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Sistema completamente aislado con tablas prefijo <code className="bg-blue-100 px-1 rounded">poc_*</code></li>
            <li>• No afecta el funcionamiento actual del sistema de conversaciones</li>
            <li>• <strong>Sincronización automática incremental</strong> via webhook de WAHA</li>
            <li>• Cada mensaje nuevo actualiza el thread correspondiente en tiempo real</li>
            <li>• Las métricas se calculan agregando todos los chats del mismo cliente</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
