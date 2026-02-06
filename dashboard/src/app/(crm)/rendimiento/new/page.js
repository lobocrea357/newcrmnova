"use client";

import { useState, useEffect } from "react";
import {
  supabase,
  getAllBots,
  getConversationsByBot,
  isBotExcluded,
} from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, FileText, Loader2, AlertCircle, Users, Lightbulb, ArrowRight, Save, MessageSquare, Download, CheckCircle } from "lucide-react";
import FiltrosRendimiento from "@/components/rendimiento/FiltrosRendimiento";
import HeroOnboarding from "@/components/rendimiento/HeroOnboarding";
import ResumenRendimiento from "@/components/rendimiento/ResumenRendimiento";
import TablaEvaluaciones from "@/components/rendimiento/TablaEvaluaciones";
import ModalWhatsApp from "@/components/rendimiento/ModalWhatsApp";
import GeneradorReporte from "@/components/rendimiento/GeneradorReporte";
import StepWizard from "@/components/rendimiento/StepWizard";
import StepCard from "@/components/rendimiento/StepCard";
import {
  simularAnalisisIA,
  PARAMETROS_EVALUACION,
} from "@/lib/mockRendimiento";
import { parseBotSessionName } from "@/lib/botNameParser";
import {
  createPerformanceAnalysis,
  createAnalysisWithReport,
  saveMultipleEvaluations,
  calculateAnalysisStats,
  createReport,
} from "@/lib/supabaseRendimiento";
import { generatePerformanceReport } from "@/lib/aiPerformance";
import { loadConversationsForAnalysis } from "@/lib/conversationLoader";
import {
  analyzeConversationsBatch,
  processEvaluationsWithScores,
} from "@/lib/batchAIAnalysis";
import { generateFilterReport } from "@/lib/chatFilters";
import Breadcrumb from "@/components/ui/Breadcrumb";
import InstructionsModal from "@/components/rendimiento/InstructionsModal";

export default function RendimientoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [bots, setBots] = useState([]);
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [conversaciones, setConversaciones] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState({});
  const [seleccionadas, setSeleccionadas] = useState([]);

  const [loadingBots, setLoadingBots] = useState(true);
  const [loadingConversaciones, setLoadingConversaciones] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const [progresoAnalisis, setProgresoAnalisis] = useState(null);

  const [modalWhatsAppOpen, setModalWhatsAppOpen] = useState(false);
  const [modalReporteOpen, setModalReporteOpen] = useState(false);
  const [initialChatId, setInitialChatId] = useState(null);

  // Estado para guardar análisis
  const [guardando, setGuardando] = useState(false);
  const fechaAnalisis = new Date().toISOString().split("T")[0];
  const [performanceAnalysisId, setPerformanceAnalysisId] = useState(null);

  // Estado para el stepper
  const [currentStep, setCurrentStep] = useState(1);

  // Estado para análisis masivo
  const [analizandoMasivo, setAnalizandoMasivo] = useState(false);
  const [progresoMasivo, setProgresoMasivo] = useState([]);

  // Estado para modal de instrucciones
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    // Detectar si se debe ejecutar análisis masivo automáticamente
    const masivo = searchParams.get("masivo");
    if (masivo === "true" && bots.length > 0 && !analizandoMasivo) {
      handleAnalisisMasivo();
    }
  }, [searchParams, bots]);

  const checkUser = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Error obteniendo sesión:", error);
    }

    if (!session?.user) {
      router.push("/login");
      return;
    }

    setUser(session.user);
    fetchBots();
  };

  const fetchBots = async () => {
    try {
      setLoadingBots(true);
      const botsData = await getAllBots();
      setBots(botsData);
    } catch (error) {
      console.error("Error fetching bots:", error);
    } finally {
      setLoadingBots(false);
    }
  };

  const handleAnalisisMasivo = async () => {
    if (!user) {
      alert("Debes iniciar sesión para realizar análisis masivos");
      return;
    }

    const confirmacion = window.confirm(
      `¿Analizar TODOS los asesores a la vez?\n\nSe cargarán las últimas 20 conversaciones de cada asesor y se realizará el análisis automático con IA.\n\nEsto puede tomar varios minutos.\n\n¿Continuar?`,
    );

    if (!confirmacion) return;

    try {
      setAnalizandoMasivo(true);
      setProgresoMasivo([]);

      // Filtrar bots de prueba/testing (Abraham, Abrahama, Paul Hernandez)
      const botsValidos = bots.filter(
        (bot) => !isBotExcluded(bot.session_name),
      );

      if (botsValidos.length === 0) {
        alert("No hay asesores válidos para analizar");
        setAnalizandoMasivo(false);
        return;
      }

      // Preparar progreso inicial
      const botsProgreso = botsValidos.map((bot) => ({
        botId: bot.id,
        botName: parseBotSessionName(bot.session_name).fullName,
        status: "pending",
        conversaciones: 0,
        score: 0,
        percentage: 0,
      }));
      setProgresoMasivo(botsProgreso);

      // Buscar perfil del usuario
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user?.id)
        .single();

      // Analizar cada bot válido secuencialmente
      for (let i = 0; i < botsValidos.length; i++) {
        const bot = botsValidos[i];
        const botName = parseBotSessionName(bot.session_name).fullName;

        // Actualizar progreso: analizando
        setProgresoMasivo((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, status: "analyzing" } : p)),
        );

        try {
          // PASO 1: Cargar conversaciones con filtros inteligentes
          setProgresoMasivo((prev) =>
            prev.map((p, idx) => (idx === i ? { ...p, status: "loading" } : p)),
          );

          const { conversations, stats: filterStats } = await loadConversationsForAnalysis(
            bot.id,
            {
              targetValid: 20, // Objetivo: 20 conversaciones válidas
              maxAttempts: 300, // Revisar hasta 300 chats si es necesario
              excludeGroups: true,
              excludeInternal: true,
              useCache: true,
              minLastMessageDays: 30,
            }
          );

          console.log(`Bot ${botName}:`, generateFilterReport(filterStats));

          if (!conversations || conversations.length === 0) {
            setProgresoMasivo((prev) =>
              prev.map((p, idx) =>
                idx === i ? { ...p, status: "skipped", conversaciones: 0 } : p
              )
            );
            continue;
          }

          // PASO 2: Análisis IA en batch (más eficiente)
          setProgresoMasivo((prev) =>
            prev.map((p, idx) => (idx === i ? { ...p, status: "analyzing" } : p))
          );

          const evaluacionesIA = await analyzeConversationsBatch(
            conversations,
            null, // Sin callback de progreso individual
            15 // Batch size
          );

          // Procesar con scores
          const evaluacionesConScores = processEvaluationsWithScores(
            evaluacionesIA
          );

          // CRÍTICO: Pasar evaluacionesConScores (con score/percentage calculado)
          const stats = calculateAnalysisStats(evaluacionesConScores);

          // Crear análisis
          const analysisData = {
            analysis_name: `Análisis Masivo - ${botName} - ${new Date().toLocaleDateString("es-ES")}`,
            bot_id: bot.id,
            worker_id: bot.worker_id || null,
            analysis_date: fechaAnalisis,
            ...stats,
            generated_by: "AI",
            created_by_user_id: profileData?.id || null,
            status: "finalized",
          };

          // Guardar evaluaciones con FK temporal (se crearán después del análisis)
          const evaluacionesArray = Object.entries(evaluacionesIA).map(
            ([chatId, evalData]) => ({
              chat_id: chatId,
              bot_id: bot.id,
              worker_id: bot.worker_id || null,
              // performance_analysis_id se agregará después
              evaluation_date: new Date().toISOString(),
              generated_by: "AI",
              manually_edited: false,
              evaluated_by_user_id: profileData?.id || null,
              ...Object.fromEntries(
                PARAMETROS_EVALUACION.map((param) => [
                  param.key,
                  evalData[param.key] || false,
                ]),
              ),
              score: evalData.score || 0,
              max_score: 7,
              percentage: parseFloat(evalData.percentage || 0),
              ai_feedback: evalData.ai_feedback || null,
              manager_notes: null,
            }),
          );

          // Crear análisis CON reporte automático
          const result = await createAnalysisWithReport(analysisData, evaluacionesArray);
          const analysis = result.analysis;
          const report = result.report;

          if (!report) {
            console.warn(`⚠️ Reporte no generado para ${botName}: ${result.reportError || 'Error desconocido'}`);
          }

          // Actualizar evaluaciones con el ID del análisis y guardar
          const evaluacionesConAnalisis = evaluacionesArray.map(ev => ({
            ...ev,
            performance_analysis_id: analysis.id
          }));

          await saveMultipleEvaluations(evaluacionesConAnalisis);

          console.log('✅ Análisis y reporte generados para:', botName);

          // Actualizar progreso: completado
          setProgresoMasivo((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? {
                  ...p,
                  status: "completed",
                  conversaciones: conversations.length,
                  score: parseFloat(stats.average_score),
                  percentage: parseFloat(stats.average_percentage),
                }
                : p,
            ),
          );
        } catch (error) {
          console.error(`Error analizando bot ${botName}:`, error);
          setProgresoMasivo((prev) =>
            prev.map((p, idx) => (idx === i ? { ...p, status: "error" } : p)),
          );
        }
      }

      alert("¡Análisis masivo completado! Redirigiendo al dashboard...");
      window.location.href = "/rendimiento";
    } catch (error) {
      console.error("Error en análisis masivo:", error);
      alert("Error al realizar el análisis masivo");
    } finally {
      setAnalizandoMasivo(false);
    }
  };

  const handleLoadConversations = async () => {
    if (!selectedBotId) {
      alert("Por favor selecciona un asesor");
      return;
    }

    try {
      setLoadingConversaciones(true);
      setConversaciones([]);
      setEvaluaciones({});
      setSeleccionadas([]);

      const result = await getConversationsByBot(selectedBotId, 1, 100);

      const ultimasConversaciones = result.data.slice(0, 25);

      setConversaciones(ultimasConversaciones);
      setSeleccionadas(ultimasConversaciones.map((c) => c.id));
      setCurrentStep(2);

      if (ultimasConversaciones.length === 0) {
        alert("No se encontraron conversaciones para este asesor");
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      alert("Error al cargar conversaciones");
    } finally {
      setLoadingConversaciones(false);
    }
  };

  const handleGenerarAnalisis = async () => {
    if (seleccionadas.length === 0) {
      alert("Por favor selecciona al menos una conversación para analizar");
      return;
    }

    const conversacionesSeleccionadas = conversaciones.filter((c) =>
      seleccionadas.includes(c.id),
    );

    // Detectar conversaciones con análisis manual/editado
    const chatsEditadosManualmente = conversacionesSeleccionadas.filter(
      (conv) => evaluaciones[conv.id]?.manually_edited,
    );

    let conversacionesAProcesar = conversacionesSeleccionadas;

    // Si hay chats editados manualmente, preguntar al usuario
    if (chatsEditadosManualmente.length > 0) {
      const mensaje = `⚠️ ADVERTENCIA: ${chatsEditadosManualmente.length} de las conversaciones seleccionadas tienen análisis manual o editado.\n\n¿Deseas SOBRESCRIBIR estos análisis manuales con IA?\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📌 Botón "ACEPTAR":\n   → Se sobrescribirán los análisis manuales\n   → Todas las conversaciones se analizarán con IA\n\n📌 Botón "CANCELAR":\n   → Se excluirán del análisis con IA\n   → Se mantendrán las evaluaciones manuales\n   → Solo se analizarán las conversaciones sin evaluar\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━`;

      const incluirEditados = window.confirm(mensaje);

      if (!incluirEditados) {
        // Usuario eligió CANCELAR: Excluir los chats editados manualmente
        conversacionesAProcesar = conversacionesSeleccionadas.filter(
          (conv) => !evaluaciones[conv.id]?.manually_edited,
        );

        if (conversacionesAProcesar.length === 0) {
          alert(
            "ℹ️ No hay conversaciones para analizar después de excluir las editadas manualmente.\n\nTodas las conversaciones seleccionadas tienen análisis manual.",
          );
          return;
        }

        alert(
          `✓ Se analizarán ${conversacionesAProcesar.length} conversaciones sin evaluar.\n\n${chatsEditadosManualmente.length} conversaciones con análisis manual se mantendrán intactas.`,
        );
      } else {
        // Usuario eligió ACEPTAR: Sobrescribir todo
        alert(
          `⚠️ Se sobrescribirán ${chatsEditadosManualmente.length} análisis manuales.\n\nProcediendo con análisis de IA...`,
        );
      }
    }

    try {
      setAnalizando(true);
      setProgresoAnalisis({
        current: 0,
        total: conversacionesAProcesar.length,
      });

      const evaluacionesGeneradas = await simularAnalisisIA(
        conversacionesAProcesar,
        (progreso) => {
          setProgresoAnalisis(progreso);
        },
      );

      // Mantener las evaluaciones manuales si el usuario decidió no sobrescribirlas
      const evaluacionesFinales = { ...evaluaciones, ...evaluacionesGeneradas };

      setEvaluaciones(evaluacionesFinales);
      setProgresoAnalisis(null);
      setCurrentStep(3);

      const mensajeExito =
        chatsEditadosManualmente.length > 0 &&
          conversacionesAProcesar.length < conversacionesSeleccionadas.length
          ? `✅ Análisis completado para ${conversacionesAProcesar.length} conversaciones\n(${chatsEditadosManualmente.length} conversaciones manuales fueron preservadas)`
          : `✅ Análisis completado para ${conversacionesAProcesar.length} conversaciones`;

      alert(mensajeExito);
    } catch (error) {
      console.error("Error generando análisis:", error);
      alert("Error al generar análisis");
    } finally {
      setAnalizando(false);
    }
  };

  const handleEvaluacionChange = (chatId, nuevaEvaluacion) => {
    setEvaluaciones((prev) => ({
      ...prev,
      [chatId]: nuevaEvaluacion,
    }));
  };

  const handleVerConversacion = (chatId) => {
    setInitialChatId(chatId);
    setModalWhatsAppOpen(true);
  };

  const handleGenerarReporte = () => {
    if (Object.keys(evaluaciones).length === 0) {
      alert("No hay evaluaciones para generar el reporte");
      return;
    }
    setModalReporteOpen(true);
  };

  const handleGuardarAnalisis = async () => {
    if (Object.keys(evaluaciones).length === 0) {
      alert("No hay evaluaciones para guardar");
      return;
    }

    const confirmacion = window.confirm(
      `¿Guardar análisis de ${botName}?\n\nFecha: ${fechaAnalisis}\nConversaciones: ${Object.keys(evaluaciones).length}\n\nEste análisis quedará guardado en el sistema.`,
    );

    if (!confirmacion) return;

    try {
      setGuardando(true);

      const userId = null;

      // Calcular estadísticas (evaluaciones ya tienen scores)
      const stats = calculateAnalysisStats(evaluaciones);

      // Crear el análisis
      const analysisData = {
        analysis_name: `Análisis ${botName} - ${new Date().toLocaleDateString("es-ES")}`,
        bot_id: selectedBotId,
        worker_id: selectedBot?.worker_id || null,
        analysis_date: fechaAnalisis,
        ...stats,
        generated_by: Object.values(evaluaciones).some(
          (e) => !e.manually_edited,
        )
          ? "AI"
          : "Manual",
        created_by_user_id: userId,
        status: "finalized",
      };

      // Preparar evaluaciones para el análisis
      const evaluacionesArray = Object.entries(evaluaciones).map(
        ([chatId, evalData]) => ({
          chat_id: chatId,
          bot_id: selectedBotId,
          worker_id: selectedBot?.worker_id || null,
          // performance_analysis_id se agregará después
          evaluation_date: new Date().toISOString(),
          generated_by: evalData.manually_edited ? "Manual" : "AI",
          manually_edited: evalData.manually_edited || false,
          evaluated_by_user_id: userId,
          ...Object.fromEntries(
            PARAMETROS_EVALUACION.map((param) => [
              param.key,
              evalData[param.key] || false,
            ]),
          ),
          score: evalData.score || 0,
          max_score: 7,
          percentage: parseFloat(evalData.percentage || 0),
          ai_feedback: evalData.ai_feedback || null,
          manager_notes: null,
        }),
      );

      // Crear análisis CON reporte automático
      // Las evaluaciones ya se pasan y se guardan en el backend
      const result = await createAnalysisWithReport(analysisData, evaluacionesArray);
      const analysis = result.analysis;
      const report = result.report;

      if (!report) {
        console.warn(`⚠️ Reporte no generado: ${result.reportError || 'Error desconocido'}`);
      }

      // Las evaluaciones ya fueron guardadas por Express con el analysis_id correcto
      console.log(`✅ Análisis y evaluaciones guardadas por Express`);

      setCurrentStep(4);

      alert(
        `✅ Análisis guardado exitosamente\n\nID: ${analysis.id}\nConversaciones: ${evaluacionesArray.length}\nScore promedio: ${stats.average_score}/7`,
      );

      // Redirigir al dashboard después de un momento
      setTimeout(() => {
        window.location.href = "/rendimiento";
      }, 1500);
    } catch (error) {
      console.error("Error guardando análisis:", error);
      alert("Error al guardar el análisis. Por favor intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const selectedBot = bots.find((b) => b.id === selectedBotId);
  const botName = selectedBot
    ? parseBotSessionName(selectedBot.session_name).fullName
    : "Asesor";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Step Wizard */}
      <div className="bg-white border-b border-gray-200 py-8">
        <StepWizard currentStep={currentStep} totalSteps={4} />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumb with Help Button */}
          <div className="flex items-center justify-between">
            <Breadcrumb items={[
              { label: "Dashboard", href: "/" },
              { label: "Rendimiento", href: "/rendimiento" },
              { label: "Nuevo Análisis", href: "/rendimiento/new" },
            ]} />

            {/* Floating Help Button */}
            <button
              onClick={() => setShowInstructions(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl"
              title="Ver instrucciones"
            >
              <Lightbulb className="h-4 w-4" />
              ¿Cómo usar?
            </button>
          </div>

          {/* STEP 1: Seleccionar Asesor */}
          {currentStep === 1 && (
            <StepCard
              title="¿Qué asesor quieres analizar?"
              description="Selecciona un asesor para comenzar el análisis de rendimiento"
              icon={Users}
            >
              {loadingBots ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                  <p className="text-gray-600">Cargando asesores...</p>
                </div>
              ) : (
                <>
                  <select
                    value={selectedBotId}
                    onChange={(e) => setSelectedBotId(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg"
                  >
                    <option value="">Selecciona un asesor</option>
                    {bots.map((bot) => (
                      <option key={bot.id} value={bot.id}>
                        {parseBotSessionName(bot.session_name).displayName}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      if (selectedBotId) {
                        setCurrentStep(2);
                      } else {
                        alert("Por favor selecciona un asesor");
                      }
                    }}
                    disabled={!selectedBotId}
                    className="w-full mt-6 px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    Continuar
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </StepCard>
          )}

          {/* STEP 2: Cargar Conversaciones */}
          {currentStep === 2 && (
            <StepCard
              title="Cargar Conversaciones"
              description={`Asesor seleccionado: ${botName}`}
              icon={MessageSquare}
            >
              {conversaciones.length === 0 ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>¿Qué período quieres analizar?</strong>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Se cargarán las conversaciones del día de hoy
                    </p>
                  </div>

                  <button
                    onClick={handleLoadConversations}
                    disabled={loadingConversaciones}
                    className="w-full px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {loadingConversaciones ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Cargando conversaciones...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5" />
                        Cargar Conversaciones
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setCurrentStep(1)}
                    className="w-full mt-3 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ← Cambiar Asesor
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      <strong>
                        {conversaciones.length} conversaciones cargadas
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentStep(3)}
                    className="w-full px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    Continuar
                    <ArrowRight className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => {
                      setConversaciones([]);
                      setCurrentStep(2);
                    }}
                    className="w-full mt-3 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cargar Otras Conversaciones
                  </button>
                </>
              )}
            </StepCard>
          )}

          {/* STEP 3: Analizar */}
          {currentStep === 3 && (
            <StepCard
              title="Analizar Conversaciones"
              description={`${conversaciones.length} conversaciones listas para analizar`}
              icon={Sparkles}
            >
              {Object.keys(evaluaciones).length === 0 ? (
                <>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                      Análisis Automático con IA
                    </h3>
                    <p className="text-sm text-gray-700 mb-2">
                      La IA evaluará automáticamente:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Tiempo de contacto</li>
                      <li>• Tiempo de respuesta</li>
                      <li>• Calidad de cotización</li>
                      <li>• Técnicas de cierre</li>
                      <li>• Y 3 parámetros más...</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleAnalizar}
                    disabled={analizando}
                    className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {analizando ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Analizando... {Math.round(progreso)}%
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Analizar con IA
                      </>
                    )}
                  </button>

                  <div className="text-center mt-4">
                    <p className="text-xs text-gray-500 mb-2">o</p>
                    <button
                      onClick={() => {
                        // TODO: Implementar evaluación manual
                        alert("Función de evaluación manual próximamente");
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900 underline"
                    >
                      Evaluar manualmente
                    </button>
                  </div>

                  <button
                    onClick={() => setCurrentStep(2)}
                    className="w-full mt-6 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ← Volver
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      <strong>Análisis completado</strong>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      {Object.keys(evaluaciones).length} conversaciones
                      evaluadas
                    </p>
                  </div>

                  <button
                    onClick={() => setCurrentStep(4)}
                    className="w-full px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    Continuar
                    <ArrowRight className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => {
                      setEvaluaciones({});
                      setCurrentStep(3);
                    }}
                    className="w-full mt-3 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Volver a Analizar
                  </button>
                </>
              )}
            </StepCard>
          )}

          {/* STEP 4: Guardar */}
          {currentStep === 4 && (
            <StepCard
              title="Guardar Análisis"
              description="Revisa el resumen y guarda el análisis"
              icon={Save}
            >
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  📊 Resumen del Análisis
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Asesor:</span>
                    <span className="font-medium text-gray-900">{botName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversaciones:</span>
                    <span className="font-medium text-gray-900">
                      {Object.keys(evaluaciones).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Score Promedio:</span>
                    <span className="font-medium text-gray-900">
                      {calcularPromedios().scorePromedio}/7
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rendimiento:</span>
                    <span className="font-medium text-gray-900">
                      {calcularPromedios().porcentajePromedio}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Evaluaciones listas para guardar
                  </span>
                </div>
              </div>

              <button
                onClick={handleGuardarAnalisis}
                disabled={guardando}
                className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {guardando ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Guardar y Ver Reporte
                  </>
                )}
              </button>

              <button
                onClick={() => setCurrentStep(3)}
                className="w-full mt-3 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                ← Editar Evaluaciones
              </button>
            </StepCard>
          )}

          {/* Filtros compactos cuando ya hay conversaciones */}
          {conversaciones.length > 0 && (
            <>
              <FiltrosRendimiento
                bots={bots}
                selectedBotId={selectedBotId}
                onBotSelect={setSelectedBotId}
                onLoadConversations={handleLoadConversations}
                loading={loadingConversaciones || loadingBots}
              />

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Evaluaciones de {botName}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {conversaciones.length} conversaciones encontradas •{" "}
                      {seleccionadas.length} seleccionadas
                    </p>
                    {Object.keys(evaluaciones).length > 0 && (
                      <div className="mt-2 flex gap-3 items-center">
                        <div className="flex gap-2 items-center">
                          <label className="text-xs text-gray-600">
                            Fecha de análisis:
                          </label>
                          <input
                            type="date"
                            value={fechaAnalisis}
                            disabled
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-gray-100"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {Object.keys(evaluaciones).length > 0 && (
                      <>
                        <button
                          onClick={handleGuardarAnalisis}
                          disabled={guardando}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                        >
                          {guardando ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          {guardando ? "Guardando..." : "Guardar Análisis"}
                        </button>
                        <button
                          onClick={handleGenerarReporte}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors shadow-lg"
                        >
                          <FileText className="h-4 w-4" />
                          Vista Previa PDF
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleGenerarAnalisis}
                      disabled={seleccionadas.length === 0 || analizando}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow"
                    >
                      {analizando ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analizando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Análisis con IA (Opcional)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {analizando && progresoAnalisis && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 text-indigo-600 animate-spin flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-indigo-900">
                            Analizando conversación {progresoAnalisis.current}{" "}
                            de {progresoAnalisis.total}
                          </p>
                          <p className="text-sm font-medium text-indigo-900">
                            {Math.round(
                              (progresoAnalisis.current /
                                progresoAnalisis.total) *
                              100,
                            )}
                            %
                          </p>
                        </div>
                        <div className="w-full bg-indigo-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(progresoAnalisis.current / progresoAnalisis.total) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-indigo-700 mt-2">
                          {progresoAnalisis.contactName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {Object.keys(evaluaciones).length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-medium text-green-900">
                        Análisis completado para{" "}
                        {Object.keys(evaluaciones).length} conversaciones
                      </p>
                    </div>
                    <p className="text-xs text-green-700 mt-2">
                      💡 Puedes revisar y editar las evaluaciones haciendo clic
                      en "Ver Chat" o ajustar manualmente los parámetros
                    </p>
                  </div>
                )}
              </div>

              {Object.keys(evaluaciones).length > 0 && (
                <ResumenRendimiento
                  evaluaciones={evaluaciones}
                  conversaciones={conversaciones}
                />
              )}

              <TablaEvaluaciones
                conversaciones={conversaciones}
                evaluaciones={evaluaciones}
                onEvaluacionChange={handleEvaluacionChange}
                onVerConversacion={handleVerConversacion}
                seleccionadas={seleccionadas}
                onSeleccionChange={setSeleccionadas}
              />
            </>
          )}
        </div>
      </div>

      {/* Modal de Progreso Masivo */}
      {analizandoMasivo && progresoMasivo.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Users className="h-8 w-8" />
                Análisis Masivo en Progreso
              </h2>
              <p className="text-purple-100 mt-2">
                Procesando{" "}
                {progresoMasivo.filter((p) => p.status === "completed").length}{" "}
                de {progresoMasivo.length} asesores
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {progresoMasivo.map((progreso, index) => {
                  const statusIcons = {
                    pending: {
                      icon: "⏸️",
                      color: "text-gray-400",
                      bg: "bg-gray-50",
                      label: "Esperando",
                    },
                    filtering: {
                      icon: "🔍",
                      color: "text-purple-600",
                      bg: "bg-purple-50",
                      label: "Filtrando con IA",
                    },
                    analyzing: {
                      icon: "⏳",
                      color: "text-blue-600",
                      bg: "bg-blue-50",
                      label: "Analizando",
                    },
                    generating_report: {
                      icon: "📝",
                      color: "text-indigo-600",
                      bg: "bg-indigo-50",
                      label: "Generando reporte",
                    },
                    completed: {
                      icon: "✅",
                      color: "text-green-600",
                      bg: "bg-green-50",
                      label: "Completado",
                    },
                    skipped: {
                      icon: "⏭️",
                      color: "text-gray-500",
                      bg: "bg-gray-100",
                      label: "Omitido",
                    },
                    error: {
                      icon: "❌",
                      color: "text-red-600",
                      bg: "bg-red-50",
                      label: "Error",
                    },
                  };

                  const statusConfig =
                    statusIcons[progreso.status] || statusIcons.pending;

                  return (
                    <div
                      key={progreso.botId}
                      className={`p-4 rounded-lg border transition-all ${progreso.status === "analyzing"
                        ? "border-blue-300 shadow-md"
                        : "border-gray-200"
                        } ${statusConfig.bg}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{statusConfig.icon}</span>
                          <div className="flex-1">
                            <p
                              className={`font-semibold ${statusConfig.color}`}
                            >
                              {progreso.botName}
                            </p>
                            {progreso.status === "completed" && (
                              <p className="text-sm text-gray-600">
                                {progreso.conversaciones} conversaciones •
                                Score: {progreso.score.toFixed(1)}/7 •{" "}
                                {progreso.percentage.toFixed(0)}%
                              </p>
                            )}
                            {(progreso.status === "filtering" ||
                              progreso.status === "analyzing" ||
                              progreso.status === "generating_report") && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <p className="text-sm">
                                    Procesando conversaciones...
                                  </p>
                                </div>
                              )}
                            {progreso.status === "skipped" && (
                              <p className="text-xs text-gray-500">
                                Sin conversaciones
                              </p>
                            )}
                            {progreso.status === "error" && (
                              <p className="text-xs text-red-600">
                                Error al procesar
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <ModalWhatsApp
        isOpen={modalWhatsAppOpen}
        onClose={() => setModalWhatsAppOpen(false)}
        conversaciones={conversaciones}
        evaluaciones={evaluaciones}
        onEvaluacionChange={handleEvaluacionChange}
        initialChatId={initialChatId}
      />

      <GeneradorReporte
        isOpen={modalReporteOpen}
        onClose={() => setModalReporteOpen(false)}
        evaluaciones={evaluaciones}
        conversaciones={conversaciones}
        botName={botName}
      />

      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
    </div>
  );
}
