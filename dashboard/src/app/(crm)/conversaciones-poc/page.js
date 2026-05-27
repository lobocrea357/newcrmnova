"use client";

import { useState, useEffect } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Users, MessageSquare, ArrowRight, RefreshCw, TrendingUp, Database, Play, AlertCircle, CheckCircle } from "lucide-react";
import ThreadRow from "@/components/poc/ThreadRow";
import { POC_API } from "@/config/apiConfig";

export default function ConversacionesPoCPage() {
  const { isSuperAdmin, loading: authLoading, role, profile } = useUserProfile();
  const [threads, setThreads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para sincronización histórica
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResult, setSyncResult] = useState(null);
  const [showSyncModal, setShowSyncModal] = useState(false);

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

  const syncHistoricalSales = async (dryRun = false) => {
    setSyncing(true);
    setSyncProgress(0);
    setSyncResult(null);

    try {
      const response = await fetch(POC_API.syncHistoricalSales(dryRun), {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Error syncing historical sales');

      const { data } = await response.json();
      setSyncResult(data);
      
      // Refrescar threads y stats después de sincronizar
      if (!dryRun) {
        await fetchThreads();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error syncing historical sales:', error);
      setSyncResult({
        success: false,
        error: error.message
      });
    } finally {
      setSyncing(false);
      setSyncProgress(100);
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
            <div className="flex items-center gap-4">
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2 text-white">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-medium">Sincronización automática via webhook</span>
                </div>
              </div>
              <button
                onClick={() => setShowSyncModal(true)}
                disabled={syncing}
                className="flex items-center gap-2 bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <Database className="h-5 w-5" />
                <span className="text-sm font-medium">Sincronizar Ventas Históricas</span>
              </button>
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

        {/* Modal de Sincronización Histórica */}
        {showSyncModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Database className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Sincronizar Ventas Históricas</h2>
                    <p className="text-sm text-gray-600">Vincular ventas existentes con threads por teléfono</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              {!syncResult ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-2">¿Qué hace esta sincronización?</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Revisa todos los vuelos en la base de datos</li>
                      <li>• Busca threads con el mismo número de teléfono</li>
                      <li>• Crea eventos SALE_CONFIRMED para ventas sin evento</li>
                      <li>• Actualiza el estado del thread a VENTA_CONCRETADA</li>
                    </ul>
                  </div>

                  {syncing ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" />
                      <p className="text-gray-600 text-lg mb-2">Sincronizando ventas históricas...</p>
                      <p className="text-sm text-gray-500">Por favor espere, esto puede tomar varios minutos</p>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => syncHistoricalSales(true)}
                        className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>Simular (Dry Run)</span>
                        </div>
                      </button>
                      <button
                        onClick={() => syncHistoricalSales(false)}
                        className="flex-1 px-4 py-3 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Play className="h-4 w-4" />
                          <span>Ejecutar Sincronización</span>
                        </div>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  {syncResult.success ? (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <div>
                          <h3 className="font-semibold text-green-900">Sincronización Completada</h3>
                          <p className="text-sm text-green-700">Proceso finalizado exitosamente</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600">Vuelos procesados</p>
                          <p className="text-2xl font-bold text-gray-900">{syncResult.total_vuelos}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600">Threads encontrados</p>
                          <p className="text-2xl font-bold text-gray-900">{syncResult.threads_encontrados}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600">Eventos creados</p>
                          <p className="text-2xl font-bold text-green-600">{syncResult.eventos_creados}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600">Vuelos sin thread</p>
                          <p className="text-2xl font-bold text-amber-600">{syncResult.vuelos_sin_thread}</p>
                        </div>
                      </div>

                      {syncResult.detalles && syncResult.detalles.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                          <h4 className="font-semibold text-gray-900 mb-2">Detalles</h4>
                          <div className="space-y-1 text-sm">
                            {syncResult.detalles.slice(0, 10).map((detalle, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-gray-700">
                                <span className={`w-2 h-2 rounded-full ${
                                  detalle.estado === 'CREADO' ? 'bg-green-500' :
                                  detalle.estado === 'YA_EXISTE' ? 'bg-blue-500' :
                                  detalle.estado === 'SIN_THREAD' ? 'bg-amber-500' :
                                  detalle.estado === 'DRY_RUN_CREARIA' ? 'bg-purple-500' :
                                  'bg-red-500'
                                }`} />
                                <span className="font-mono text-xs">{detalle.telefono}</span>
                                <span className="text-gray-500">-</span>
                                <span>{detalle.estado}</span>
                              </div>
                            ))}
                            {syncResult.detalles.length > 10 && (
                              <p className="text-gray-500 text-xs mt-2">
                                ... y {syncResult.detalles.length - 10} más
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                      <div>
                        <h3 className="font-semibold text-red-900">Error en Sincronización</h3>
                        <p className="text-sm text-red-700">{syncResult.error}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setSyncResult(null);
                        setShowSyncModal(false);
                      }}
                      className="flex-1 px-4 py-3 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
