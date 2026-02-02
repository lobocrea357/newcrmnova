"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  Save,
  SlidersHorizontal,
  BarChart3,
  List,
} from "lucide-react";
import {
  getMockAdvisorById,
  getMockConversationsForAdvisor,
  METRIC_LABELS,
} from "@/lib/mockPerformanceData";
import PerformanceTracking from "@/components/rendimiento/PerformanceTracking";
import Breadcrumb from "@/components/ui/Breadcrumb";

function formatShortDateTime(iso) {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function ConversationRow({ conversation, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-3 transition-colors ${
        isActive
          ? "bg-indigo-50 border-indigo-200"
          : "bg-white border-gray-200 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 truncate">
              {conversation.contactName || "Sin nombre"}
            </span>
            {conversation.involvedInAnalysis && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Incluida
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">
            {conversation.contactNumber}
          </div>
          <div className="text-xs text-gray-600 mt-2 line-clamp-2">
            {conversation.lastMessagePreview}
          </div>
        </div>
        <div className="text-[11px] text-gray-500 whitespace-nowrap">
          {formatShortDateTime(conversation.updatedAt)}
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message }) {
  const isAdvisor = message.from === "advisor";
  return (
    <div className={`flex ${isAdvisor ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 border ${
          isAdvisor
            ? "bg-indigo-600 text-white border-indigo-700"
            : "bg-white text-gray-900 border-gray-200"
        }`}
      >
        <div className="text-sm whitespace-pre-wrap">{message.text}</div>
        <div
          className={`text-[11px] mt-1 ${
            isAdvisor ? "text-indigo-100" : "text-gray-500"
          }`}
        >
          {formatShortDateTime(message.ts)}
        </div>
      </div>
    </div>
  );
}

export default function AsesorAnalisisDetallePage() {
  const router = useRouter();
  const params = useParams();
  const advisorId = params?.id;

  const advisor = useMemo(() => getMockAdvisorById(advisorId), [advisorId]);
  const conversations = useMemo(
    () => getMockConversationsForAdvisor(advisorId),
    [advisorId],
  );

  const [activeConversationId, setActiveConversationId] = useState(
    conversations[0]?.id || null,
  );
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId],
  );

  const [editedEvaluation, setEditedEvaluation] = useState(null);
  const [saveState, setSaveState] = useState({ saving: false, saved: false });
  const [activeTab, setActiveTab] = useState('conversaciones'); // 'conversaciones' | 'seguimiento'

  useEffect(() => {
    setActiveConversationId((prev) => prev || conversations[0]?.id || null);
  }, [conversations]);

  useEffect(() => {
    if (!activeConversation?.evaluation) {
      setEditedEvaluation(null);
      return;
    }
    // Copia editable
    setEditedEvaluation({ ...activeConversation.evaluation });
    setSaveState({ saving: false, saved: false });
  }, [activeConversationId]); // intencional: reset al cambiar conversación

  const metricKeys = useMemo(() => Object.keys(METRIC_LABELS), []);

  const handleToggleMetric = (key) => {
    setEditedEvaluation((prev) => ({ ...prev, [key]: !prev?.[key] }));
    setSaveState((s) => ({ ...s, saved: false }));
  };

  const handleSave = async () => {
    // En esta fase es mock: simulamos guardado
    setSaveState({ saving: true, saved: false });
    await new Promise((r) => setTimeout(r, 450));
    setSaveState({ saving: false, saved: true });
  };

  if (!advisor) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <button
              onClick={() => router.push("/rendimiento")}
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Rendimiento
            </button>
            <div className="mt-4 text-gray-900 font-semibold">
              Asesor no encontrado (mock)
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Verifica el id en la URL.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <div className="p-6">
        <div className="max-w-[1600px] mx-auto space-y-4">
          {/* Breadcrumb */}
          <Breadcrumb items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Rendimiento", href: "/rendimiento" },
            { label: advisor?.name || "Detalle Asesor", href: `/rendimiento/asesor/${advisorId}` }
          ]} />

          {/* Header con Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/rendimiento")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Volver"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-500">
                  Detalle de análisis del asesor
                </div>
                <div className="text-xl font-bold text-gray-900 truncate">
                  {advisor.name}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                  <MessageSquare className="h-4 w-4" />
                  {conversations.length} conversaciones
                </div>
                <button
                  onClick={handleSave}
                  disabled={!editedEvaluation || saveState.saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {saveState.saving
                    ? "Guardando..."
                    : saveState.saved
                      ? "Guardado"
                      : "Guardar"}
                </button>
              </div>
            </div>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('conversaciones')}
                className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 ${
                  activeTab === 'conversaciones'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <List className="h-4 w-4" />
                Conversaciones Individuales
              </button>
              <button
                onClick={() => setActiveTab('seguimiento')}
                className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 ${
                  activeTab === 'seguimiento'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Seguimiento Histórico
              </button>
            </div>
          </div>

          {/* Contenido según tab activo */}
          {activeTab === 'conversaciones' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Izquierda: lista de conversaciones */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">
                      Conversaciones
                    </div>
                    <div className="text-xs text-gray-500">
                      {conversations.length}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Selecciona una para revisar y editar.
                  </div>
                </div>
                <div className="p-3 space-y-2 max-h-[72vh] overflow-y-auto">
                  {conversations.map((c) => (
                    <ConversationRow
                      key={c.id}
                      conversation={c}
                      isActive={c.id === activeConversationId}
                      onClick={() => setActiveConversationId(c.id)}
                    />
                  ))}
                  {conversations.length === 0 && (
                    <div className="p-6 text-center text-sm text-gray-600">
                      No hay conversaciones mock para este asesor.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Centro: visor de conversación */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {activeConversation?.contactName || "Conversación"}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {activeConversation?.contactNumber || ""}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {activeConversation?.updatedAt
                        ? formatShortDateTime(activeConversation.updatedAt)
                        : ""}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-linear-to-b from-gray-50 to-white">
                  <div className="space-y-3 max-h-[72vh] overflow-y-auto">
                    {(activeConversation?.messages || []).map((m) => (
                      <MessageBubble key={m.id} message={m} />
                    ))}
                    {!activeConversation && (
                      <div className="p-6 text-center text-sm text-gray-600">
                        Selecciona una conversación.
                      </div>
                    )}
                    {activeConversation &&
                      (activeConversation?.messages || []).length === 0 && (
                        <div className="p-6 text-center text-sm text-gray-600">
                          No hay mensajes mock para esta conversación.
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* Derecha: edición del resultado */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-gray-600" />
                    <div className="font-semibold text-gray-900">
                      Resultado del análisis
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Ajusta checkboxes y notas para esta conversación.
                  </div>
                </div>

                <div className="p-4 space-y-4 max-h-[72vh] overflow-y-auto">
                  {!editedEvaluation && (
                    <div className="text-sm text-gray-600">
                      Selecciona una conversación con evaluación.
                    </div>
                  )}

                  {!!editedEvaluation && (
                    <>
                      <div className="space-y-2">
                        {metricKeys.map((key) => {
                          const checked = !!editedEvaluation?.[key];
                          return (
                            <label
                              key={key}
                              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                                checked
                                  ? "bg-green-50 border-green-200"
                                  : "bg-white border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 accent-indigo-600"
                                checked={checked}
                                onChange={() => handleToggleMetric(key)}
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-gray-900">
                                  {METRIC_LABELS[key]}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {checked ? "Cumplido" : "No cumplido"}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-2">
                          Notas
                        </div>
                        <textarea
                          value={editedEvaluation?.notes || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setEditedEvaluation((prev) => ({
                              ...prev,
                              notes: v,
                            }));
                            setSaveState((s) => ({ ...s, saved: false }));
                          }}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="Escribe observaciones para este resultado..."
                        />
                        <div className="text-xs text-gray-500 mt-2">
                          Nota: por ahora el guardado es mock (simulado).
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          ) : (
          <div>
            <PerformanceTracking 
              advisor={advisor}
              historicalData={advisor?.history || []}
            />
          </div>
          )}
          {/* fin contenido */}
        </div>
      </div>
    </div>
  );
}

