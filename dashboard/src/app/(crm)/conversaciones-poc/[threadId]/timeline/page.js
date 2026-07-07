"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ArrowLeft, MessageSquare, DollarSign, Plus, RefreshCw, User } from "lucide-react";
import TimelineEnriched from "@/components/poc/TimelineEnriched";
import EventForm from "@/components/poc/EventForm";
import { POC_API } from "@/config/apiConfig";

export default function ThreadTimelinePage() {
  const params = useParams();
  const router = useRouter();
  const { isSuperAdmin, isAdmin, loading: authLoading, profile } = useUserProfile();
  const threadId = params.threadId;
  
  const [showEventForm, setShowEventForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [threadData, setThreadData] = useState(null);
  const [loadingThread, setLoadingThread] = useState(true);

  const handleEventCreated = () => {
    setShowEventForm(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleSaleCreated = () => {
    setShowSaleForm(false);
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    const hasAccess = isSuperAdmin || isAdmin;
    
    if (!authLoading && profile && !hasAccess) {
      router.push('/no-autorizado');
    }
  }, [isSuperAdmin, isAdmin, authLoading, profile, router]);

  useEffect(() => {
    const hasAccess = isSuperAdmin || isAdmin;
    
    if (threadId && hasAccess) {
      fetchThreadData();
    }
  }, [threadId, isSuperAdmin, isAdmin]);

  const fetchThreadData = async () => {
    try {
      setLoadingThread(true);
      // Fetch con límite mayor para encontrar el thread
      const response = await fetch(POC_API.threads(200));
      const data = await response.json();
      
      if (data.success) {
        const thread = data.data.find(t => t.id === threadId);
        setThreadData(thread);
      }
    } catch (error) {
      console.error('[Timeline] Error fetching thread data:', error);
    } finally {
      setLoadingThread(false);
    }
  };

  // Validar acceso antes de renderizar
  const hasAccess = isSuperAdmin || isAdmin;
  
  if (authLoading || !hasAccess || !profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/conversaciones-poc')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Volver a Threads</span>
            </button>
            
            {loadingThread ? (
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-indigo-600 animate-spin" />
                <span className="text-sm text-gray-500">Cargando datos del cliente...</span>
              </div>
            ) : threadData ? (
              <div className="flex items-center gap-4">
                {/* Avatar del cliente */}
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <User className="h-7 w-7 text-white" />
                </div>
                
                {/* Datos del cliente */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {threadData.customer_name || 'Sin nombre'}
                  </h1>
                  <p className="text-sm text-gray-600 font-mono">
                    {threadData.customer_phone}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <MessageSquare className="h-8 w-8 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Timeline Enriquecido
                  </h1>
                  <p className="text-sm text-gray-600">
                    Cliente no encontrado
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Enriched */}
        <TimelineEnriched key={refreshKey} threadId={threadId} showMessages={true} showEvents={true} />

        {/* Footer Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información del Timeline Enriquecido</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Muestra mensajes y eventos intercalados en orden cronológico</li>
            <li>• Los eventos automáticos se generan via triggers (ventas, cotizaciones, etc.)</li>
            <li>• Los eventos manuales se crean desde el formulario de eventos</li>
            <li>• La sincronización es incremental en tiempo real via webhook</li>
          </ul>
        </div>

        {/* Botones flotantes */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
          {/* Botón Agregar Evento */}
          <button
            onClick={() => setShowEventForm(true)}
            className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all hover:scale-105"
            title="Agregar evento manual"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Evento</span>
          </button>

          {/* Botón Marcar Venta */}
          <button
            onClick={() => setShowSaleForm(true)}
            className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 hover:shadow-xl transition-all hover:scale-105"
            title="Marcar venta"
          >
            <DollarSign className="h-5 w-5" />
            <span className="font-medium">Marcar Venta</span>
          </button>
        </div>

        {/* Modal EventForm */}
        <EventForm
          threadId={threadId}
          isOpen={showEventForm}
          onSuccess={handleEventCreated}
          onCancel={() => setShowEventForm(false)}
        />

        {/* Modal para marcar venta (reusando EventForm con preselección) */}
        {showSaleForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🎉 Marcar Venta</h2>
              <p className="text-sm text-gray-600 mb-6">
                Ingresa el monto de la venta para marcarla como concretada.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto (USD)
                  </label>
                  <input
                    type="number"
                    id="saleAmount"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSaleForm(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      const amount = document.getElementById('saleAmount').value;
                      if (amount) {
                        // Aquí podrías llamar a la API para marcar la venta
                        // Por ahora solo cerramos el modal
                        setShowSaleForm(false);
                        setRefreshKey(prev => prev + 1);
                      }
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
