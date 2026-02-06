"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, Users, Loader2 } from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ModalAnalisisMuestra from "@/components/rendimiento/ModalAnalisisMuestra";
import { supabase, getAllBots, isBotExcluded } from "@/lib/supabase";
import { parseBotSessionName } from "@/lib/botNameParser";
import { loadConversationsForAnalysis } from "@/lib/conversationLoader";
import { analyzeConversationsBatch, processEvaluationsWithScores } from "@/lib/batchAIAnalysis";
import { generateFilterReport } from "@/lib/chatFilters";
import { createAnalysisWithReport, saveMultipleEvaluations, calculateAnalysisStats } from "@/lib/supabaseRendimiento";
import { PARAMETROS_EVALUACION } from "@/lib/mockRendimiento";

export default function MuestraAnalisisPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [analyzingMassive, setAnalyzingMassive] = useState(false);
  const [massiveProgress, setMassiveProgress] = useState([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/" },
              { label: "Rendimiento", href: "/rendimiento" },
              { label: "Muestra de Análisis", href: "/rendimiento/muestra-analisis" },
            ]}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full p-6">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Muestra de Análisis con IA
              </h1>
              <p className="text-gray-600 max-w-md mx-auto">
                Selecciona un asesor y las conversaciones que deseas analizar.
                La IA evaluará automáticamente el rendimiento basándose en los parámetros establecidos.
              </p>
            </div>

            <div className="pt-4 space-y-4">
              <button
                onClick={() => setModalOpen(true)}
                disabled={analyzingMassive}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-5 w-5" />
                Análisis Individual
              </button>

              <button
                onClick={handleAnalisisMasivo}
                disabled={analyzingMassive}
                className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl hover:from-orange-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzingMassive ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Users className="h-5 w-5" />
                )}
                {analyzingMassive ? 'Analizando...' : 'Análisis Masivo'}
              </button>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={() => router.push("/rendimiento")}
                className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2 mx-auto transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <ModalAnalisisMuestra
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* Modal de progreso masivo */}
      {analyzingMassive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Análisis Masivo en Progreso</h3>
            <div className="space-y-2">
              {massiveProgress.map((bot, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                  <div>
                    <div className="font-semibold text-gray-900">{bot.botName}</div>
                    <div className="text-sm text-gray-600">
                      {bot.status === 'pending' && '⏳ Pendiente'}
                      {bot.status === 'loading' && '📥 Cargando conversaciones...'}
                      {bot.status === 'analyzing' && '🤖 Analizando con IA...'}
                      {bot.status === 'completed' && `✅ Completado - ${bot.conversaciones} convs`}
                      {bot.status === 'skipped' && '⏭️ Sin conversaciones'}
                      {bot.status === 'error' && '❌ Error'}
                    </div>
                  </div>
                  {bot.status === 'completed' && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-600">{bot.score.toFixed(1)}</div>
                      <div className="text-xs text-gray-500">{bot.percentage.toFixed(0)}%</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  async function handleAnalisisMasivo() {
    const confirmacion = window.confirm(
      '¿Ejecutar Análisis Masivo?\n\nSe analizarán TODOS los asesores automáticamente con IA.\nEsto puede tardar varios minutos.\n\n¿Continuar?'
    );

    if (!confirmacion) return;

    try {
      setAnalyzingMassive(true);
      setMassiveProgress([]);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Debes iniciar sesión');
        return;
      }

      // NO usar user_id - profiles está vacía y causa foreign key error
      const userId = null;

      const bots = await getAllBots();
      const validBots = bots.filter(bot => !isBotExcluded(bot.session_name));

      if (validBots.length === 0) {
        alert('No hay asesores válidos para analizar');
        return;
      }

      const botsProgress = validBots.map(bot => ({
        botId: bot.id,
        botName: parseBotSessionName(bot.session_name).fullName,
        status: 'pending',
        conversaciones: 0,
        score: 0,
        percentage: 0,
      }));
      setMassiveProgress(botsProgress);

      const fechaAnalisis = new Date().toISOString().split('T')[0];

      for (let i = 0; i < validBots.length; i++) {
        const bot = validBots[i];
        const botName = parseBotSessionName(bot.session_name).fullName;

        try {
          // PASO 1: Cargar conversaciones
          setMassiveProgress(prev =>
            prev.map((p, idx) => (idx === i ? { ...p, status: 'loading' } : p))
          );

          const { conversations, stats: filterStats } = await loadConversationsForAnalysis(
            bot.id,
            {
              limit: 200,
              excludeGroups: true,
              excludeInternal: true,
              useCache: true,
              minLastMessageDays: 30,
            }
          );

          console.log(`Bot ${botName}:`, generateFilterReport(filterStats));

          if (!conversations || conversations.length === 0) {
            setMassiveProgress(prev =>
              prev.map((p, idx) => (idx === i ? { ...p, status: 'skipped' } : p))
            );
            continue;
          }

          // PASO 2: Análisis IA en batch
          setMassiveProgress(prev =>
            prev.map((p, idx) => (idx === i ? { ...p, status: 'analyzing' } : p))
          );

          const evaluacionesIA = await analyzeConversationsBatch(
            conversations,
            null,
            15
          );

          const evaluacionesConScores = processEvaluationsWithScores(evaluacionesIA);
          // CRÍTICO: Pasar evaluacionesConScores (con score/percentage calculado)
          const stats = calculateAnalysisStats(evaluacionesConScores);

          // Crear análisis
          const analysisData = {
            analysis_name: `Análisis Masivo - ${botName} - ${new Date().toLocaleDateString('es-ES')}`,
            bot_id: bot.id,
            worker_id: bot.worker_id || null,
            analysis_date: fechaAnalisis,
            ...stats,
            generated_by: 'AI',
            created_by_user_id: userId,
            status: 'finalized',
          };

          const evaluacionesArray = Object.entries(evaluacionesIA).map(
            ([chatId, evalData]) => ({
              chat_id: chatId,
              bot_id: bot.id,
              worker_id: bot.worker_id || null,
              evaluation_date: new Date().toISOString(),
              generated_by: 'AI',
              manually_edited: false,
              evaluated_by_user_id: userId,
              ...Object.fromEntries(
                PARAMETROS_EVALUACION.map(param => [
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

          const evaluacionesConAnalisis = evaluacionesArray.map(ev => ({
            ...ev,
            performance_analysis_id: analysis.id,
          }));

          await saveMultipleEvaluations(evaluacionesConAnalisis);

          console.log('✅ Análisis y reporte generados para:', botName);

          setMassiveProgress(prev =>
            prev.map((p, idx) =>
              idx === i
                ? {
                    ...p,
                    status: 'completed',
                    conversaciones: conversations.length,
                    score: parseFloat(stats.average_score),
                    percentage: parseFloat(stats.average_percentage),
                  }
                : p
            )
          );
        } catch (error) {
          console.error(`Error analizando bot ${botName}:`, error);
          setMassiveProgress(prev =>
            prev.map((p, idx) => (idx === i ? { ...p, status: 'error' } : p))
          );
        }
      }

      alert('¡Análisis masivo completado! Redirigiendo al dashboard...');
      router.push('/rendimiento');
    } catch (error) {
      console.error('Error en análisis masivo:', error);
      alert('Error al realizar el análisis masivo');
    } finally {
      setAnalyzingMassive(false);
    }
  }
}
