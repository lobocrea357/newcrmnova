"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Loader2, CheckCircle2, AlertCircle, Users } from "lucide-react";
import {
  supabase,
  getAllBots,
  isBotExcluded,
} from "@/lib/supabase";
import { parseBotSessionName } from "@/lib/botNameParser";
import { PARAMETROS_EVALUACION } from "@/lib/mockRendimiento";
import {
  createAnalysisWithReport,
  saveMultipleEvaluations,
  calculateAnalysisStats,
} from "@/lib/supabaseRendimiento";
import { loadConversationsForAnalysis } from "@/lib/conversationLoader";
import {
  analyzeConversationsBatch,
  processEvaluationsWithScores,
} from "@/lib/batchAIAnalysis";
import { generateFilterReport } from "@/lib/chatFilters";

export default function ModalAnalisisMuestra({ open, onClose }) {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [bots, setBots] = useState([]);
  const [selectedBotId, setSelectedBotId] = useState("");
  const [selectedBot, setSelectedBot] = useState(null);
  const [conversaciones, setConversaciones] = useState([]);
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [loadingBots, setLoadingBots] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [filterStats, setFilterStats] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    if (open) {
      checkUser();
      resetModal();
    }
  }, [open]);

  const checkUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      fetchBots();
    }
  };

  const fetchBots = async () => {
    try {
      setLoadingBots(true);
      const botsData = await getAllBots();
      const validBots = botsData.filter(
        (bot) => !isBotExcluded(bot.session_name)
      );
      setBots(validBots);
    } catch (error) {
      console.error("Error fetching bots:", error);
    } finally {
      setLoadingBots(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setSelectedBotId("");
    setSelectedBot(null);
    setConversaciones([]);
    setSelectedConversations([]);
    setAnalyzing(false);
    setAnalysisProgress(null);
    setAnalysisComplete(false);
    setAnalysisResult(null);
  };

  const handleSelectBot = async (botId) => {
    setSelectedBotId(botId);
    const bot = bots.find((b) => b.id === botId);
    setSelectedBot(bot);
  };

  const handleLoadConversations = async () => {
    if (!selectedBotId) {
      alert("Por favor selecciona un asesor");
      return;
    }

    try {
      setLoadingConversations(true);
      setConversaciones([]);
      setSelectedConversations([]);
      setFilterStats(null);

      // Usar loader inteligente con filtros estructurales
      // NOTA: excludeInternal = false porque el usuario selecciona manualmente
      const { conversations, stats } = await loadConversationsForAnalysis(
        selectedBotId,
        {
          limit: 100,
          excludeGroups: true,
          excludeInternal: false, // Usuario excluye manualmente
          useCache: true,
          minLastMessageDays: 30,
        }
      );

      console.log(generateFilterReport(stats));

      // Tomar las últimas 50 para análisis
      const ultimasConversaciones = conversations.slice(0, 50);

      setConversaciones(ultimasConversaciones);
      setFilterStats(stats);
      setStep(2);

      if (ultimasConversaciones.length === 0) {
        alert(
          "No se encontraron conversaciones válidas.\n" +
          `Grupos excluidos: ${stats.excluded_groups}\n` +
          `Chats internos: ${stats.excluded_internal}`
        );
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      alert("Error al cargar conversaciones");
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleToggleConversation = (chatId) => {
    setSelectedConversations((prev) => {
      if (prev.includes(chatId)) {
        return prev.filter((id) => id !== chatId);
      } else {
        if (prev.length >= 20) {
          alert("Solo puedes seleccionar hasta 20 conversaciones");
          return prev;
        }
        return [...prev, chatId];
      }
    });
  };

  const handleSelectAll = () => {
    const maxConversations = Math.min(conversaciones.length, 20);
    setSelectedConversations(conversaciones.slice(0, maxConversations).map((c) => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedConversations([]);
  };

  const handleAnalyzeAll = () => {
    if (conversaciones.length === 0) {
      alert("No hay conversaciones para analizar");
      return;
    }
    // Seleccionar hasta 20 conversaciones automáticamente
    const toSelect = conversaciones.slice(0, 20).map(c => c.id);
    setSelectedConversations(toSelect);
    // Ejecutar análisis inmediatamente
    setTimeout(() => handleAnalyze(), 100);
  };

  const handleAnalyze = async () => {
    if (selectedConversations.length === 0) {
      alert("Por favor selecciona al menos una conversación");
      return;
    }

    const conversacionesSeleccionadas = conversaciones.filter((c) =>
      selectedConversations.includes(c.id)
    );

    const confirmacion = window.confirm(
      `¿Analizar ${conversacionesSeleccionadas.length} conversaciones de ${parseBotSessionName(selectedBot.session_name).fullName}?\n\nLa IA evaluará automáticamente cada conversación en lotes (más rápido).`
    );

    if (!confirmacion) return;

    try {
      setAnalyzing(true);
      setAnalysisProgress({ current: 0, total: conversacionesSeleccionadas.length });

      // Usar análisis en batch (más eficiente)
      const evaluacionesGeneradas = await analyzeConversationsBatch(
        conversacionesSeleccionadas,
        (progreso) => {
          setAnalysisProgress(progreso);
        },
        15 // Tamaño de batch
      );

      // Procesar con scores
      console.log('🔄 PASO 1: Procesando evaluaciones con scores...');
      console.log('   Evaluaciones generadas:', Object.keys(evaluacionesGeneradas).length);

      const evaluacionesConScores = processEvaluationsWithScores(evaluacionesGeneradas);
      console.log('✅ PASO 1 completado - Evaluaciones con scores:', Object.keys(evaluacionesConScores).length);

      // NO usar user_id - profiles está vacía y causa foreign key error
      const userId = null;

      // CRÍTICO: Pasar evaluacionesConScores (con score/percentage calculado)
      console.log('🔄 PASO 2: Calculando stats de análisis...');
      const stats = calculateAnalysisStats(evaluacionesConScores);
      console.log('✅ PASO 2 completado - Stats:', stats);

      const botName = parseBotSessionName(selectedBot.session_name).fullName;
      const analysisData = {
        analysis_name: `Muestra de Análisis - ${botName} - ${new Date().toLocaleDateString("es-ES")}`,
        bot_id: selectedBotId,
        worker_id: selectedBot?.worker_id || null,
        analysis_date: new Date().toISOString().split("T")[0],
        ...stats,
        generated_by: "AI",
        created_by_user_id: userId,
        status: "finalized",
      };

      const evaluacionesArray = Object.entries(evaluacionesConScores).map(
        ([chatId, evalData]) => ({
          chat_id: chatId,
          bot_id: selectedBotId,
          worker_id: selectedBot?.worker_id || null,
          evaluation_date: new Date().toISOString(),
          generated_by: "AI_BATCH",
          manually_edited: false,
          evaluated_by_user_id: userId,
          ...Object.fromEntries(
            PARAMETROS_EVALUACION.map((param) => [
              param.key,
              evalData[param.key] || false,
            ])
          ),
          score: evalData.score || 0,
          max_score: 7,
          percentage: parseFloat(evalData.percentage || 0),
          ai_feedback: evalData.ai_feedback || null,
          manager_notes: null,
        })
      );

      const { analysis, report } = await createAnalysisWithReport(
        analysisData,
        evaluacionesArray
      );

      const evaluacionesConAnalisis = evaluacionesArray.map((ev) => ({
        ...ev,
        performance_analysis_id: analysis.id,
      }));

      await saveMultipleEvaluations(evaluacionesConAnalisis);

      setAnalysisResult({
        analysis,
        report,
        stats,
        conversationsCount: conversacionesSeleccionadas.length,
      });

      setAnalysisComplete(true);
      setStep(3);
    } catch (error) {
      console.error("Error analizando conversaciones:", error);
      alert("Error al analizar las conversaciones. Por favor intenta de nuevo.");
    } finally {
      setAnalyzing(false);
      setAnalysisProgress(null);
    }
  };

  const handleClose = () => {
    if (analyzing) {
      const confirmar = window.confirm(
        "El análisis está en progreso. ¿Seguro que quieres cancelar?"
      );
      if (!confirmar) return;
    }
    resetModal();
    onClose();
  };

  const handleViewResults = () => {
    window.location.href = "/rendimiento/reportes";
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-white" />
            <h2 className="text-2xl font-bold text-white">
              Muestra de Análisis con IA
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            disabled={analyzing}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  Paso 1: Selecciona un Asesor
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Elige el asesor cuyas conversaciones deseas analizar con IA
                </p>

                {loadingBots ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                    {bots.map((bot) => {
                      const botInfo = parseBotSessionName(bot.session_name);
                      return (
                        <button
                          key={bot.id}
                          onClick={() => handleSelectBot(bot.id)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${selectedBotId === bot.id
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-200 hover:border-emerald-300 bg-white"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-900">
                                {botInfo.fullName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {bot.phone_number}
                              </div>
                            </div>
                            {selectedBotId === bot.id && (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleLoadConversations}
                  disabled={!selectedBotId || loadingConversations}
                  className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loadingConversations ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    "Cargar Conversaciones"
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Paso 2: Selecciona las Conversaciones
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Elige hasta 20 conversaciones para análisis con IA
                </p>
                {filterStats && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs">
                    <div className="font-semibold text-blue-900 mb-1">📈 Filtrado Inteligente Aplicado:
                    </div>
                    <div className="text-blue-800 space-y-0.5">
                      <div>• Total encontrado: {filterStats.total}</div>
                      <div>• Grupos excluidos: {filterStats.excluded_groups}</div>
                      <div>• Chats internos: {filterStats.excluded_internal}</div>
                      {filterStats.excluded_cache > 0 && (
                        <div>• Excluidos por cache: {filterStats.excluded_cache}</div>
                      )}
                      <div className="font-semibold text-green-700">✓ Conversaciones válidas: {filterStats.passed}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <span className="font-semibold text-gray-900">
                      {selectedConversations.length} / 20
                    </span>
                    <span className="text-gray-600"> conversaciones seleccionadas</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAnalyzeAll}
                      className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md flex items-center gap-2"
                      title="Selecciona y analiza automáticamente las primeras 20 conversaciones"
                    >
                      <Sparkles className="h-4 w-4" />
                      Analizar Todo (20)
                    </button>
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                    >
                      Seleccionar 20
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {conversaciones.map((conv) => (
                    <label
                      key={conv.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedConversations.includes(conv.id)
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-emerald-300 bg-white"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedConversations.includes(conv.id)}
                        onChange={() => handleToggleConversation(conv.id)}
                        className="mt-1 h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {conv.contact_name || conv.contact_phone || conv.name || "Sin nombre"}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {conv.last_message || "Sin mensaje"}
                        </div>
                        {conv.last_message_at && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(conv.last_message_at).toLocaleDateString("es-ES")}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={selectedConversations.length === 0 || analyzing}
                  className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analizar con IA
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && analysisComplete && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="bg-green-100 rounded-full p-6">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  ¡Análisis Completado!
                </h3>
                <p className="text-gray-600">
                  Se han analizado exitosamente {analysisResult?.conversationsCount}{" "}
                  conversaciones
                </p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Resumen de Resultados
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-emerald-100">
                    <div className="text-sm text-gray-600 mb-1">Score Promedio</div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {analysisResult?.stats.average_score}
                      <span className="text-sm text-gray-500">/7</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-emerald-100">
                    <div className="text-sm text-gray-600 mb-1">Porcentaje</div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {analysisResult?.stats.average_percentage}%
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-emerald-100">
                    <div className="text-sm text-gray-600 mb-1">Conversaciones</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {analysisResult?.conversationsCount}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-emerald-100">
                    <div className="text-sm text-gray-600 mb-1">Estado</div>
                    <div className="text-sm font-semibold text-green-600">
                      Finalizado
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-blue-900 mb-1">
                      Análisis guardado exitosamente
                    </div>
                    <div className="text-sm text-blue-700">
                      El análisis ha sido guardado en el sistema y ahora está disponible
                      en la sección de reportes para su revisión y descarga.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleViewResults}
                  className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Ver en Reportes
                </button>
              </div>
            </div>
          )}

          {analyzing && analysisProgress && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Analizando conversaciones...
                    </h3>
                    <p className="text-sm text-gray-600">
                      {analysisProgress.current} de {analysisProgress.total} completadas
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${(analysisProgress.current / analysisProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                  {analysisProgress.contactName && (
                    <p className="text-xs text-gray-500 italic">
                      Analizando: {analysisProgress.contactName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
