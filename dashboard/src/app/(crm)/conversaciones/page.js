'use client'
import { useState, useEffect, Suspense } from 'react'
import { jsPDF } from 'jspdf'
import {
  supabase,
  getAllWorkers,
  getConversationsByBot,
  globalSearchChats,
  getCompletedSalesCount,
  getCompletedSalesConversations,
  getBotCotizacionesCount
} from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useBots } from '@/hooks/useBots'
import ContactAvatar from '@/components/ContactAvatar'
import HighlightText from '@/components/HighlightText'
import {
  Bot,
  MessageSquare,
  LogOut,
  RefreshCw,
  Users,
  Search,
  Filter,
  Phone,
  Circle,
  ChevronDown,
  ChevronUp,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  CheckCheck,
  ArrowUp,
  ArrowDown,
  Brain,
  ArrowRight,
  Clock3,
  CreditCard,
  Sparkles,
  Edit3,
  FileText,
  Download,
  Loader2
} from "lucide-react";

function DashboardContent() {
  const { user } = useAuth();
  const { bots, loading: botsLoading, error: botsError } = useBots();
  const [workers, setWorkers] = useState([]);
  const [conversations, setConversations] = useState({});
  const [conversationsPagination, setConversationsPagination] = useState({});
  const [botCotizaciones, setBotCotizaciones] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState({});
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'inactive'
  const [leaderFilter, setLeaderFilter] = useState("all"); // 'all', 'moises', 'jesus', 'endry'
  const [leadFilter, setLeadFilter] = useState("all"); // 'all', 'colombia', 'venezuela'
  const [sedeFilter, setSedeFilter] = useState("all"); // 'all', 'nova', 'apolo', 'flash'
  const [showFilters, setShowFilters] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [syncingBot, setSyncingBot] = useState(null);
  const [salesCount, setSalesCount] = useState(0);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesConversations, setSalesConversations] = useState([]);
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [salesModalLoading, setSalesModalLoading] = useState(false);
  const [salesModalError, setSalesModalError] = useState(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [sessionToken, setSessionToken] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportPrompt, setReportPrompt] = useState(`Eres un Auditor Comercial Senior especializado en ventas de alto impacto. 
Tu misión es auditar al asesor basándote ESTRICTAMENTE en los siguientes 13 KPIs:

CRÍTICOS (TIEMPOS):
1. Tiempo de contacto inicial: Máximo 5 minutos.
2. Tiempo de respuesta promedio: Máximo 5 minutos.
3. Tiempo de envío de cotización: Máximo 15 minutos.

AUDITORÍA COMERCIAL:
4. Lead respondió: ¿Hubo interacción real?
5. Número de teléfono: ¿Se obtuvo o validó?
6. Cierre con intención: ¿El asesor presionó por el cierre de forma profesional?
7. Ofreció Scalapay/Financiamiento: ¿Mencionó opciones de pago flexible?
8. Más de 2 opciones: ¿Presentó alternativas al cliente?
9. Seguimiento estructurado: ¿Hubo un plan de contacto posterior?
10. Preguntas de negociación: ¿Indagó sobre necesidades y presupuesto?
11. Calidad de cotización: ¿Es clara, atractiva y profesional?
12. Manejo de objeciones: ¿Supo rebatir dudas del cliente?
13. Venta confirmada: ¿Se cerró la transacción?

INSTRUCCIONES DE REPORTE:
- Identifica faltas en los tiempos críticos de forma prioritaria (¡Es vital!).
- Cita fragmentos del chat que demuestren el manejo de objeciones o cierres.
- Si el asesor tardó más de 5m en responder o 15m en cotizar, señalalo como ERROR CRÍTICO.
- No inventes datos. Si algo no está presente, márcalo como "No detectado".
- Usa un tono ejecutivo y directo.`);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportError, setReportError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lastChatId, setLastChatId] = useState(null);
  
  // Estados para búsqueda global
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isGlobalSearchActive, setIsGlobalSearchActive] = useState(false);
  const [loadingGlobalSearch, setLoadingGlobalSearch] = useState(false);
  
  // Estado para búsqueda de asesores en el panel lateral
  const [botSearchQuery, setBotSearchQuery] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (reportModalOpen) {
      setReportError(null);
      setReportData(null);
    }
  }, [reportModalOpen]);

  const checkUser = async () => {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Error obteniendo sesión:', error);
    }

    if (!session?.user) {
      router.push('/login');
      return;
    }

    // setUser(session.user); // No es necesario - el contexto maneja el estado automáticamente
    setSessionToken(session.access_token || null);
    fetchData();
  };

  useEffect(() => {
    const botIdFromUrl = searchParams.get("botId");
    if (!botIdFromUrl) return;

    if (!bots || bots.length === 0) return;

    setSelectedBotId(botIdFromUrl);

    // Intentar restaurar la página guardada para este bot
    if (typeof window !== "undefined") {
      try {
        const savedPage = window.localStorage.getItem(
          `conversaciones:bot:${botIdFromUrl}:page`,
        );
        const page = savedPage ? parseInt(savedPage, 10) : 1;
        fetchConversations(botIdFromUrl, page);
      } catch (error) {
        console.error("Error restaurando página guardada:", error);
        fetchConversations(botIdFromUrl);
      }
    } else {
      fetchConversations(botIdFromUrl);
    }
  }, [searchParams, bots]);

  // Cargar cotizaciones para todos los bots visibles automáticamente
  useEffect(() => {
    if (!bots || bots.length === 0) return;

    const loadCotizaciones = async () => {
      const cotizacionesMap = {};
      
      // Cargar cotizaciones para cada bot en paralelo
      await Promise.all(
        bots.map(async (bot) => {
          try {
            const count = await getBotCotizacionesCount(bot.id);
            cotizacionesMap[bot.id] = count;
          } catch (error) {
            console.error(`Error cargando cotizaciones para bot ${bot.id}:`, error);
            cotizacionesMap[bot.id] = 0;
          }
        })
      );
      
      setBotCotizaciones(cotizacionesMap);
    };

    loadCotizaciones();
  }, [bots]);

  // Mantener y restaurar la última conversación visitada usando localStorage
  useEffect(() => {
    const chatIdFromUrl = searchParams.get("chatId");

    if (chatIdFromUrl) {
      setLastChatId(chatIdFromUrl);

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            "conversaciones:lastChatId",
            String(chatIdFromUrl),
          );
        } catch (error) {
          console.error("Error guardando lastChatId en localStorage:", error);
        }
      }

      return;
    }

    if (typeof window !== "undefined") {
      try {
        const storedChatId = window.localStorage.getItem(
          "conversaciones:lastChatId",
        );
        if (storedChatId) {
          setLastChatId(storedChatId);
        }
      } catch (error) {
        console.error("Error leyendo lastChatId desde localStorage:", error);
      }
    }
  }, [searchParams]);

  // Restaurar búsqueda global al regresar desde un chat
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedQuery = window.localStorage.getItem(
          "conversaciones:globalSearchQuery",
        );
        const savedResults = window.localStorage.getItem(
          "conversaciones:globalSearchResults",
        );

        if (savedQuery && savedResults) {
          setGlobalSearchQuery(savedQuery);
          setGlobalSearchResults(JSON.parse(savedResults));
          setIsGlobalSearchActive(true);

          // Limpiar el localStorage después de restaurar
          window.localStorage.removeItem("conversaciones:globalSearchQuery");
          window.localStorage.removeItem("conversaciones:globalSearchResults");
        }
      } catch (error) {
        console.error("Error restaurando búsqueda global:", error);
      }
    }
  }, []);

  const syncBotData = async (sessionName) => {
    try {
      setSyncingBot(sessionName);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/metadata-sync/${sessionName}/all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        const contactsUpdated = result.data.contacts.updated;
        const chatsUpdated = result.data.chats.updated;
        const botUpdated = result.data.bot?.updated;

        alert(
          `✅ SINCRONIZACIÓN COMPLETADA\n\n` +
            `📊 Resultados:\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `• Contactos actualizados: ${contactsUpdated}\n` +
            `• Chats actualizados: ${chatsUpdated}\n` +
            `• Bot actualizado: ${botUpdated ? "Sí ✓" : "No (ya tenía datos)"}\n\n` +
            `Los datos se reflejarán al recargar la página.`,
        );

        // Recargar datos para reflejar los cambios
        await fetchData();

        // Si hay un bot seleccionado, recargar sus conversaciones
        if (selectedBotId) {
          fetchConversations(selectedBotId);
        }
      } else {
        // Mostrar error detallado
        const errorMsg = result.error || "Error desconocido";

        // Detectar si es error de sesión no encontrada
        if (
          errorMsg.includes("NO existe") ||
          errorMsg.includes("does not exist")
        ) {
          alert(
            `⚠️ BOT NO CONECTADO EN WAHA\n\n` +
              `El bot "${sessionName}" no está activo en WAHA.\n\n` +
              `Para sincronizar datos necesitas:\n` +
              `  1. Conectar el bot en WAHA (escanear QR)\n` +
              `  2. Esperar que el estado sea "WORKING"\n` +
              `  3. Intentar la sincronización nuevamente\n\n` +
              `❌ Detalles: ${errorMsg}`,
          );
        } else {
          alert(`❌ Error en la sincronización:\n\n${errorMsg}`);
        }
      }
    } catch (error) {
      console.error("Error sincronizando bot:", error);
      alert(
        `❌ ERROR DE CONEXIÓN\n\n` +
          `No se pudo conectar con el servidor.\n\n` +
          `Detalles: ${error.message || "Error desconocido"}`,
      );
    } finally {
      setSyncingBot(null);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadingSales(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      // console.log("🔐 Sesión activa:", session?.user?.email);

      const [workersData, completedSales] = await Promise.all([
        getAllWorkers(),
        getCompletedSalesCount(),
      ]);

      // console.log("👷 Workers obtenidos:", workersData.length);
      // console.log("🤖 Bots obtenidos:", bots.length);

      setWorkers(workersData);
      setSalesCount(completedSales || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setLoadingSales(false);
    }
  };

  const handleSalesClick = async () => {
    try {
      setSalesModalLoading(true);
      setSalesModalError(null);
      setSalesModalOpen(true);

      const conversations = await getCompletedSalesConversations(200);
      setSalesConversations(conversations);
    } catch (error) {
      console.error("Error obteniendo ventas:", error);
      setSalesModalError(
        "No se pudo cargar el detalle de ventas. Intenta nuevamente.",
      );
    } finally {
      setSalesModalLoading(false);
    }
  };

  const handleCloseSalesModal = () => {
    setSalesModalOpen(false);
    setSalesModalError(null);
  };

  const appendSyncLog = (message, type = "info") => {
    setSyncLogs((prev) => [
      ...prev,
      {
        message,
        type,
        time: new Date().toLocaleTimeString("es-ES"),
      },
    ]);
  };

  const handleFullSync = async () => {
    if (syncingAll) return;

    setSyncingAll(true);
    setSyncLogs([]);
    setSyncProgress({ percent: 5, status: "Conectando con WAHA remoto..." });
    appendSyncLog(
      "🚀 Iniciando sincronización COMPLETA de TODOS los bots desde WAHA",
    );

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000); // 30 minutos

    try {
      const response = await fetch(`${apiUrl}/api/message-history/all-bots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit: 1000,
          includeMedia: true,
          transcribeAudio: true,
          fixFromMe: true,
        }),
        signal: controller.signal,
      });

      setSyncProgress({
        percent: 50,
        status: "Procesando respuesta del servidor...",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      setSyncProgress({ percent: 100, status: "Sincronización completada" });
      appendSyncLog("✅ Sincronización completada correctamente");
      appendSyncLog(`📊 Bots procesados: ${result?.data?.bots || 0}`);
      appendSyncLog(
        `💬 Conversaciones sincronizadas: ${result?.data?.chats || 0}`,
      );
      appendSyncLog(`📩 Mensajes nuevos: ${result?.data?.messages || 0}`);

      await fetchData();
    } catch (error) {
      const errorMessage =
        error.name === "AbortError"
          ? "Timeout: La sincronización tardó más de 30 minutos"
          : error.message || "Error desconocido";
      appendSyncLog(`❌ Error: ${errorMessage}`, "error");
      setSyncProgress({ percent: 0, status: `Error: ${errorMessage}` });
    } finally {
      clearTimeout(timeoutId);
      setSyncingAll(false);
    }
  };

  const handleCloseSyncModal = () => {
    if (syncingAll) return;
    setSyncProgress(null);
    setSyncLogs([]);
  };

  const fetchConversations = async (botId, page = 1) => {
    try {
      setLoadingConversations((prev) => ({ ...prev, [botId]: true }));
      const result = await getConversationsByBot(botId, page, 10);

      setConversations((prev) => ({ ...prev, [botId]: result.data }));
      setConversationsPagination((prev) => ({
        ...prev,
        [botId]: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          total: result.total,
        },
      }));

      // Calcular cotizaciones totales para este bot
      const totalCotizaciones = result.data.reduce((sum, conv) => {
        return sum + (conv.conversation_metrics?.cotizacionMentions?.count || 0);
      }, 0);
      setBotCotizaciones((prev) => ({ ...prev, [botId]: totalCotizaciones }));
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoadingConversations((prev) => ({ ...prev, [botId]: false }));
    }
  };

  const handleBotSelect = async (botId) => {
    setSelectedBotId(botId);
    await fetchConversations(botId);

    // Actualizar la URL para mantener el contexto del bot seleccionado
    const params = new URLSearchParams();
    params.set("botId", botId);
    router.push(`/conversaciones?${params.toString()}`);
  };

  const KNOWN_SEDES = ["nova", "apolo", "flash"];
  const KNOWN_LEADS = ["colombia", "venezuela"];
  const KNOWN_LEADERS = ["moises", "jesus", "endry"];

  const formatResponseTime = (minutes) => {
    if (minutes === null || minutes === undefined || Number.isNaN(minutes))
      return null;
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;
    if (minutes < 60) return `${minutes.toFixed(1)} min`;
    const hours = minutes / 60;
    if (hours < 24) return `${hours.toFixed(1)} h`;
    return `${(hours / 24).toFixed(1)} d`;
  };

  const capitalizeWord = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const cleanText = (text = "") =>
    text.replace(/\*\*/g, "").replace(/[_`]/g, "").replace(/\s+/g, " ").trim();

  const generatePdfReport = (payload, advisorName) => {
    if (!payload) return;

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const ML = 0, MR = 0;          // sin margen lateral en header
    const IX = 16;                  // margen interior de contenido
    const CW = PW - IX * 2;
    let Y = 0;

    /* ── PALETA EJECUTIVA ────────────────────────────────── */
    const NAVY   = [15,  31,  72];   // azul marino oscuro
    const BLUE   = [30,  80, 180];   // azul corporativo
    const GOLD   = [180,140,  30];   // dorado acento
    const GREEN  = [22, 163, 104];
    const ORANGE = [234,130,  20];
    const RED    = [210,  40,  40];
    const G1     = [20,  20,  20];   // texto darkest
    const G2     = [60,  60,  60];
    const G3     = [110, 110, 110];
    const G4     = [180, 180, 180];
    const G5     = [238, 240, 244];  // fondo hilera par
    const WHITE  = [255, 255, 255];

    const scoreColor = s => s >= 8 ? GREEN : s >= 6 ? ORANGE : RED;
    const scoreBg    = s => s >= 8 ? [230,248,240] : s >= 6 ? [255,243,215] : [254,226,226];

    /* ── HELPERS ─────────────────────────────────────────── */
    let pageNum = 1;

    const drawPageFooter = () => {
      doc.setFillColor(...G5);
      doc.rect(0, PH - 9, PW, 9, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...G3);
      doc.text("CONFIDENCIAL · USO INTERNO · VIAJES NOVA", IX, PH - 3.5);
      doc.setFont("helvetica", "bold");
      doc.text(`Página ${pageNum}`, PW - IX, PH - 3.5, { align: "right" });
    };

    const newPage = () => {
      drawPageFooter();
      doc.addPage();
      pageNum++;
      Y = 14;
    };

    const need = space => { if (Y + space > PH - 14) newPage(); };
    const hLine = (x1, x2, y, color = G4, lw = 0.2) => {
      doc.setDrawColor(...color); doc.setLineWidth(lw);
      doc.line(x1, y, x2, y);
    };

    /* ── DATOS ───────────────────────────────────────────── */
    const narrative = payload.aiNarrative || {};
    const audits    = narrative.audits || [];
    const N         = audits.length;

    if (N === 0) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      doc.setTextColor(...G2);
      doc.text("No se encontraron auditorías para las últimas 24 horas.", IX, 40);
      drawPageFooter();
      doc.save(`reporte_${advisorName || "asesor"}.pdf`);
      return;
    }

    const KPI = {
      contact_time:        "Tiempo de contacto",
      response_time:       "Tiempo de respuesta",
      product_knowledge:   "Conocimiento del producto",
      customer_filtering:  "Filtrado del cliente",
      quote_quality:       "Cotización (tiempo + calidad)",
      options_presented:   "Opciones presentadas (+2)",
      financing_offered:   "Financiamiento / métodos pago",
      negotiation_closing: "Negociación y cierre",
      objection_handling:  "Manejo de objeciones",
      follow_up:           "Seguimiento + asesoría",
    };
    const KEYS = Object.keys(KPI);

    let totalScore = 0, salesCount = 0;
    const agg = {};  KEYS.forEach(k => agg[k] = 0);
    audits.forEach(a => {
      totalScore += a.score || 0;
      if (a.sale_closed) salesCount++;
      KEYS.forEach(k => { if ((a.kpis || {})[k]) agg[k]++; });
    });
    const avg = parseFloat((totalScore / N).toFixed(1));

    /* ══════════════════════════════════════════════════════
       PÁGINA 1 – PORTADA EJECUTIVA
    ══════════════════════════════════════════════════════ */

    /* --- Banda superior NAVY ----------------------------- */
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, PW, 36, "F");

    /* Logo / nombre empresa */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...WHITE);
    doc.text("VIAJES NOVA", IX, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(180, 200, 240);
    doc.text("Agencia de Viajes", IX, 17);

    /* Título del reporte */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.text("REPORTE DE AUDITORÍA COMERCIAL", PW - IX, 13, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(180, 200, 240);
    doc.text(`Período: Últimas 24 horas  ·  ${new Date().toLocaleDateString("es-ES", { day:"2-digit", month:"long", year:"numeric" })}`, PW - IX, 19, { align: "right" });

    /* Línea dorada decorativa */
    doc.setFillColor(...GOLD);
    doc.rect(0, 36, PW, 1.5, "F");

    /* --- Bloque asesor ----------------------------------- */
    // Limpiar el session_name: quitar país, coordinador y sede
    const STOP_WORDS = ["colombia", "venezuela", "endry", "moises", "jesus", "nova", "apolo", "flash"];
    const cleanAdvisorName = (name = "") => {
      return (name || "Asesor")
        .split("_")
        .filter(part => !STOP_WORDS.includes(part.toLowerCase()))
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")
        .trim() || "Asesor";
    };
    const displayName = cleanAdvisorName(advisorName);

    Y = 46;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...G3);
    doc.text("ASESOR EVALUADO", IX, Y);
    Y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...G1);
    doc.text(displayName, IX, Y);
    Y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...G1);  // más oscuro
    doc.text(`${N} conversaciones auditadas  ·  Generado el ${new Date().toLocaleDateString("es-ES")}`, IX, Y);
    Y += 10;
    hLine(IX, PW - IX, Y, G4, 0.4);
    Y += 9;

    /* --- 4 KPIs de resumen ------------------------------ */
    const BW = (CW - 9) / 4;
    const KPI_BOXES = [
      { label: "PROM. 24H",    value: String(avg),         sub: "/ 10 puntos",      color: scoreColor(avg), bg: scoreBg(avg) },
      { label: `EVALUADAS`,    value: String(N),            sub: "conversaciones",   color: BLUE,            bg: [234,242,255] },
      { label: "VENTAS",       value: String(salesCount),   sub: `de ${N} chats`,    color: GREEN,           bg: [230,248,240] },
      { label: "SIN VENTA",    value: String(N-salesCount), sub: `de ${N} chats`,    color: RED,             bg: [254,226,226] },
    ];
    KPI_BOXES.forEach((b, i) => {
      const bx = IX + i * (BW + 3);
      // Fondo caja
      doc.setFillColor(...b.bg);
      doc.setDrawColor(...G4);
      doc.roundedRect(bx, Y, BW, 24, 2, 2, "FD");
      // Borde de color en la parte superior
      doc.setFillColor(...b.color);
      doc.roundedRect(bx, Y, BW, 2.5, 1, 1, "F");
      // Label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(...b.color);
      doc.text(b.label, bx + BW/2, Y + 7, { align:"center" });
      // Valor
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...b.color);
      doc.text(b.value, bx + BW/2, Y + 16, { align:"center" });
      // Sub
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.5);
      doc.setTextColor(...G3);
      doc.text(b.sub, bx + BW/2, Y + 21, { align:"center" });
    });
    Y += 33;

    /* --- Tabla cumplimiento por criterio ---------------- */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...G1);  // más oscuro
    doc.text("CUMPLIMIENTO POR CRITERIO", IX, Y);
    // Línea azul bajo el título
    doc.setFillColor(...BLUE);
    doc.rect(IX, Y + 1.5, 55, 0.8, "F");
    Y += 7;

    const R = 7; // row height
    KEYS.forEach((key, idx) => {
      const v = agg[key] || 0;
      const pct = N > 0 ? Math.round(v / N * 100) : 0;
      // Fondo alterno
      if (idx % 2 === 0) { doc.setFillColor(...G5); doc.rect(IX, Y, CW, R, "F"); }
      else                { doc.setFillColor(...WHITE); doc.rect(IX, Y, CW, R, "F"); }
      // Nombre criterio
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...G2);
      doc.text(KPI[key], IX + 3, Y + R * 0.67);
      // Barra de progreso
      const barX = IX + CW * 0.55;
      const barW = CW * 0.26;
      doc.setFillColor(220, 225, 235);
      doc.roundedRect(barX, Y + R*0.25, barW, R*0.5, 1, 1, "F");
      const fill = pct >= 80 ? GREEN : pct >= 50 ? ORANGE : RED;
      doc.setFillColor(...fill);
      doc.roundedRect(barX, Y + R*0.25, Math.max(barW * pct / 100, 1), R*0.5, 1, 1, "F");
      // Porcentaje
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...fill);
      doc.text(`${v}/${N} (${pct}%)`, IX + CW - 2, Y + R * 0.67, { align:"right" });
      Y += R;
    });

    hLine(IX, IX + CW, Y, G4, 0.3);
    Y += 8;

    /* ══════════════════════════════════════════════════════
       TARJETAS INDIVIDUALES — encabezado de sección en primera tarjeta
    ══════════════════════════════════════════════════════ */
    audits.forEach((audit, auditIdx) => {
      const kpis  = audit.kpis || {};
      const score = audit.score || 0;
      const sc    = scoreColor(score);
      const scBg  = scoreBg(score);

      // Separar nombre y teléfono si Gemini los pone juntos
      const rawClient = audit.client || "Sin nombre";
      const slashIdx  = rawClient.indexOf("/");
      const clientName  = slashIdx !== -1 ? rawClient.slice(0, slashIdx).trim() : rawClient;
      const clientPhone = slashIdx !== -1 ? rawClient.slice(slashIdx + 1).trim() : "";

      const rawAnal = (audit.analysis || "")
        .replace(/ \| /g, " ")
        .replace(/Errores:/gi,       "\nErrores:")
        .replace(/Aciertos:/gi,      "\nAciertos:")
        .replace(/Recomendación:/gi, "\nRecomendación:");
      const analLines = doc.splitTextToSize(rawAnal, CW - 8);

      const KPI_H  = 6.8;
      const cardH  = 34 + KEYS.length * KPI_H + analLines.length * 3.9 + 10;
      need(cardH + 8);

      /* Sombra simulada (rect gris desplazado) */
      doc.setFillColor(215, 220, 230);
      doc.roundedRect(IX + 0.8, Y + 0.8, CW, cardH, 3, 3, "F");
      /* Cuerpo tarjeta */
      doc.setFillColor(...WHITE);
      doc.setDrawColor(210, 218, 232);
      doc.setLineWidth(0.3);
      doc.roundedRect(IX, Y, CW, cardH, 3, 3, "FD");

      /* Banda de color en borde izquierdo */
      doc.setFillColor(...sc);
      doc.rect(IX, Y + 3, 3, cardH - 6, "F");

      let cy = Y + 7;

      /* --- Cabecera de tarjeta --- */
      /* Título de sección solo en la primera tarjeta */
      if (auditIdx === 0) {
        need(16);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...G1);
        doc.text(`DETALLE DE EVALUACIONES (${N} CONVERSACIONES)`, IX, Y);
        doc.setFillColor(...BLUE);
        doc.rect(IX, Y + 1.5, 75, 0.8, "F");
        Y += 8;
        cy = Y + 7;
      }
      /* Número de evaluación */
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...G1);
      doc.text(`EVALUACIÓN #${auditIdx + 1}  ·  ${new Date().toLocaleDateString("es-ES")}  ·  ${displayName}`, IX + 6, cy);

      /* Score en badge redondo — score + /10 DENTRO del rect */
      const BADGE_W = 24;
      const scoreX = IX + CW - BADGE_W - 2;
      doc.setFillColor(...scBg);
      doc.setDrawColor(...sc);
      doc.setLineWidth(0.5);
      doc.roundedRect(scoreX, cy - 5, BADGE_W, 10, 2, 2, "FD");
      // Número grande, posición relativa al centro-izquierda del badge
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...sc);
      doc.text(String(score), scoreX + 6, cy + 2.5);
      // "/10" pequeño justo a la derecha del número, DENTRO del badge
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...sc);
      doc.text("/10", scoreX + 14, cy + 2.5);

      cy += 7;

      /* Nombre del cliente */
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...G1);
      doc.text(clientName, IX + 6, cy);

      /* Tipo de gestión (badge pequeño) */
      if (audit.type) {
        const typeLabel = (audit.type || "").toUpperCase();
        const tw = doc.getTextWidth(typeLabel) + 4;
        const nameW = doc.getTextWidth(clientName);
        doc.setFillColor(...G5);
        doc.setDrawColor(...G4);
        doc.roundedRect(IX + 8 + nameW, cy - 4, tw, 5, 1.5, 1.5, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.5);
        doc.setTextColor(...BLUE);
        doc.text(typeLabel, IX + 10 + nameW, cy - 0.5);
      }
      cy += 4.5;

      /* Teléfono + tags */
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...G3);
      if (clientPhone) doc.text(clientPhone, IX + 6, cy);
      cy += 4;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      let tagX = IX + 6;
      doc.setFillColor(230, 248, 240); doc.setDrawColor(...GREEN); doc.roundedRect(tagX - 1, cy - 4, 20, 5.5, 1.5, 1.5, "FD");
      doc.setTextColor(...GREEN); doc.text("Respondió", tagX + 1, cy);
      tagX += 23;
      if (audit.sale_closed) {
        doc.setFillColor(219, 234, 254); doc.setDrawColor(...BLUE); doc.roundedRect(tagX - 1, cy - 4, 16, 5.5, 1.5, 1.5, "FD");
        doc.setTextColor(...BLUE); doc.text("Venta ✓", tagX + 1, cy);
      }
      cy += 8;

      /* Línea divisora */
      hLine(IX + 4, IX + CW - 4, cy, G4, 0.2);
      cy += 1;

      /* --- Checklist KPIs --- */
      KEYS.forEach((key, ki) => {
        const passed = kpis[key] === true;
        cy += KPI_H;
        /* Fondo alterno */
        if (ki % 2 === 0) { doc.setFillColor(250, 251, 253); doc.rect(IX + 4, cy - KPI_H + 1, CW - 8, KPI_H, "F"); }
        /* Icono */
        if (passed) {
          doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...GREEN);
          doc.text("✓", IX + 7, cy - 1);
        } else {
          doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(200, 205, 215);
          doc.text("✗", IX + 7, cy - 1);
        }
        /* Label */
        doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...G2);
        doc.text(KPI[key], IX + 13, cy - 1);
        /* Indicador 1 / 0 */
        doc.setFont("helvetica", "bold"); doc.setFontSize(7.5);
        if (passed) { doc.setTextColor(...GREEN); doc.text("1", IX + CW - 7, cy - 1, { align:"right" }); }
        else        { doc.setTextColor(...RED);   doc.text("0", IX + CW - 7, cy - 1, { align:"right" }); }
        /* Línea sutil */
        hLine(IX + 4, IX + CW - 4, cy + 1.5, G5, 0.15);
      });
      cy += 6;

      /* --- Análisis ejecutivo --- */
      hLine(IX + 4, IX + CW - 4, cy, G4, 0.25);
      cy += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      analLines.forEach(line => {
        if      (line.startsWith("Errores:"))        doc.setTextColor(...RED);
        else if (line.startsWith("Aciertos:"))       doc.setTextColor(...GREEN);
        else if (line.startsWith("Recomendación:"))  doc.setTextColor(...BLUE);
        else                                         doc.setTextColor(...G2);
        doc.text(line, IX + 6, cy);
        cy += 4;
      });

      Y = cy + 10;
    });

    drawPageFooter();
    doc.save(`reporte_${advisorName || "asesor"}.pdf`);
  };

  const handleGenerateReport = async () => {
    if (!selectedBotId) return;
    if (!sessionToken) {
      setReportError(
        "No se pudo validar la sesión actual. Vuelve a iniciar sesión e inténtalo de nuevo.",
      );
      return;
    }
    setReportLoading(true);
    setReportError(null);
    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          botId: selectedBotId,
          customPrompt: reportPrompt,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo generar el reporte.");
      }
      setReportData(data);
      console.log('[PDF-DEBUG] API response aiNarrative:', JSON.stringify(data.aiNarrative));
      console.log('[PDF-DEBUG] _debug field:', JSON.stringify(data._debug));
      console.log('[PDF-DEBUG] audits count:', data.aiNarrative?.audits?.length ?? 'UNDEFINED');
      generatePdfReport(data, selectedBot?.session_name);
    } catch (error) {
      console.error("Error generating report:", error);
      setReportError(error.message);
    } finally {
      setReportLoading(false);
    }
  };

  const closeReportModal = () => {
    if (reportLoading) return;
    setReportModalOpen(false);
    setReportError(null);
  };

  const parseBotSessionName = (sessionName) => {
    if (!sessionName) {
      return {
        displayName: "Sin nombre",
        sedeKey: null,
        sedeLabel: null,
        leadKey: null,
        leadLabel: null,
        leaderKey: null,
        leaderLabel: null,
      };
    }

    const tokens = String(sessionName)
      .split("_")
      .map((t) => t.trim())
      .filter(Boolean);

    const nameTokens = [];
    let sedeKey = null;
    let leadKey = null;
    let leaderKey = null;

    tokens.forEach((token) => {
      const lower = token.toLowerCase();
      if (!sedeKey && KNOWN_SEDES.includes(lower)) {
        sedeKey = lower;
        return;
      }
      if (!leadKey && KNOWN_LEADS.includes(lower)) {
        leadKey = lower;
        return;
      }
      if (!leaderKey && KNOWN_LEADERS.includes(lower)) {
        leaderKey = lower;
        return;
      }
      nameTokens.push(token);
    });

    const displayName =
      nameTokens.length > 0
        ? nameTokens
            .map((t) =>
              t
                .split("-")
                .map((part) => capitalizeWord(part))
                .join(" "),
            )
            .join(" ")
        : String(sessionName);

    return {
      displayName,
      sedeKey,
      sedeLabel: sedeKey ? capitalizeWord(sedeKey) : null,
      leadKey,
      leadLabel: leadKey ? capitalizeWord(leadKey) : null,
      leaderKey,
      leaderLabel: leaderKey ? capitalizeWord(leaderKey) : null,
    };
  };

  // Función para filtrar bots según todos los criterios
  const filterBots = (botsList) => {
    return botsList.filter((bot) => {
      const meta = parseBotSessionName(bot.session_name);

      // Filtro de búsqueda global
      if (searchFilter) {
        const searchLower = searchFilter.toLowerCase();
        const matchesSearch =
          meta.displayName.toLowerCase().includes(searchLower) ||
          bot.session_name?.toLowerCase().includes(searchLower) ||
          bot.phone_number?.toLowerCase().includes(searchLower) ||
          bot.id?.toString().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Filtro de búsqueda de asesores en el panel lateral
      if (botSearchQuery) {
        const botSearchLower = botSearchQuery.toLowerCase();
        const matchesBotSearch =
          meta.displayName.toLowerCase().includes(botSearchLower) ||
          bot.session_name?.toLowerCase().includes(botSearchLower) ||
          bot.phone_number?.toLowerCase().includes(botSearchLower);

        if (!matchesBotSearch) return false;
      }

      // Filtro de estado
      if (statusFilter === "active") {
        if (bot.status !== "working" && bot.status !== "active") return false;
      } else if (statusFilter === "inactive") {
        if (bot.status === "working" || bot.status === "active") return false;
      }

      // Filtro de líder
      if (leaderFilter !== "all" && meta.leaderKey !== leaderFilter) {
        return false;
      }

      // Filtro de lead
      if (leadFilter !== "all" && meta.leadKey !== leadFilter) {
        return false;
      }

      // Filtro de sede
      if (sedeFilter !== "all" && meta.sedeKey !== sedeFilter) {
        return false;
      }

      return true;
    });
  };

  // Obtener todos los bots filtrados (sin importar si tienen worker o no)
  const getAllFilteredBots = () => {
    return filterBots(bots);
  };

  // Función para normalizar y formatear el estado del bot
  const formatBotStatus = (status) => {
    if (!status) return "Desconocido";
    const statusLower = status.toLowerCase();

    // Mapear estados comunes a versiones más amigables
    if (
      statusLower === "working" ||
      statusLower === "active" ||
      statusLower === "online"
    ) {
      return "Activo";
    }
    if (
      statusLower === "disconnected" ||
      statusLower === "inactive" ||
      statusLower === "offline"
    ) {
      return "Inactivo";
    }

    // Si el estado viene en mayúsculas (como "WORKING"), mantenerlo
    if (status === status.toUpperCase() && status.length > 1) {
      return status;
    }

    // Capitalizar primera letra para otros estados
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  // Función para determinar si un bot está activo
  const isBotActive = (status) => {
    if (!status) return false;
    const statusLower = status.toLowerCase();
    return statusLower === "working" || statusLower === "active";
  };

  // Contador de filtros activos
  const activeFiltersCount = () => {
    let count = 0;
    if (searchFilter) count++;
    if (statusFilter !== "all") count++;
    if (leaderFilter !== "all") count++;
    if (leadFilter !== "all") count++;
    if (sedeFilter !== "all") count++;
    return count;
  };

  const clearFilters = () => {
    setSearchFilter("");
    setStatusFilter("all");
    setLeaderFilter("all");
    setLeadFilter("all");
    setSedeFilter("all");
  };

  const getActiveFilterPills = () => {
    const pills = [];

    if (searchFilter) {
      const trimmed =
        searchFilter.length > 20
          ? `${searchFilter.slice(0, 20)}…`
          : searchFilter;
      pills.push({ key: "search", label: `Búsqueda: "${trimmed}"` });
    }

    if (statusFilter !== "all") {
      let label = "Todos";
      if (statusFilter === "active") label = "Activos";
      if (statusFilter === "inactive") label = "Inactivos";
      pills.push({ key: "status", label: `Estado: ${label}` });
    }

    if (leaderFilter !== "all") {
      pills.push({
        key: "leader",
        label: `Líder: ${capitalizeWord(leaderFilter)}`,
      });
    }

    if (leadFilter !== "all") {
      pills.push({
        key: "lead",
        label: `Lead: ${capitalizeWord(leadFilter)}`,
      });
    }

    if (sedeFilter !== "all") {
      pills.push({
        key: "sede",
        label: `Sede: ${capitalizeWord(sedeFilter)}`,
      });
    }

    return pills;
  };

  const getFilterPillClasses = (key) => {
    switch (key) {
      case "status":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "leader":
        return "bg-sky-50 text-sky-700 border border-sky-200";
      case "lead":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "sede":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";
      case "search":
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const handleRemoveFilter = (key) => {
    switch (key) {
      case "search":
        setSearchFilter("");
        break;
      case "status":
        setStatusFilter("all");
        break;
      case "leader":
        setLeaderFilter("all");
        break;
      case "lead":
        setLeadFilter("all");
        break;
      case "sede":
        setSedeFilter("all");
        break;
      default:
        break;
    }
  };

  const handleConversationClick = (botId, chatId) => {
    const chatIdStr = String(chatId);
    setLastChatId(chatIdStr);

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("conversaciones:lastChatId", chatIdStr);

        // Guardar la página actual del paginador para este bot
        const currentPagination = conversationsPagination[botId];
        if (currentPagination && currentPagination.currentPage) {
          window.localStorage.setItem(
            `conversaciones:bot:${botId}:page`,
            String(currentPagination.currentPage),
          );
        }
      } catch (error) {
        console.error(
          "Error guardando en localStorage desde handleConversationClick:",
          error,
        );
      }
    }

    router.push(`/conversaciones/chat/${chatId}?botId=${botId}`);
  };

  // Función para ejecutar búsqueda global
  const handleGlobalSearch = async (query) => {
    setGlobalSearchQuery(query);

    if (!query || query.trim() === "") {
      setIsGlobalSearchActive(false);
      setGlobalSearchResults([]);
      return;
    }

    setLoadingGlobalSearch(true);
    setIsGlobalSearchActive(true);

    try {
      const results = await globalSearchChats(query);
      setGlobalSearchResults(results);
    } catch (error) {
      console.error("Error en búsqueda global:", error);
      setGlobalSearchResults([]);
    } finally {
      setLoadingGlobalSearch(false);
    }
  };

  // Función para limpiar búsqueda global
  const handleClearGlobalSearch = () => {
    setGlobalSearchQuery("");
    setGlobalSearchResults([]);
    setIsGlobalSearchActive(false);
  };

  // Función para manejar click en resultado de búsqueda global
  const handleGlobalSearchResultClick = (chat) => {
    const chatIdStr = String(chat.id);
    const botIdStr = String(chat.bot_id);

    // Guardar el estado de búsqueda en localStorage para restaurarlo después
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          "conversaciones:globalSearchQuery",
          globalSearchQuery,
        );
        window.localStorage.setItem(
          "conversaciones:globalSearchResults",
          JSON.stringify(globalSearchResults),
        );
        window.localStorage.setItem("conversaciones:lastChatId", chatIdStr);
      } catch (error) {
        console.error("Error guardando búsqueda global:", error);
      }
    }

    // Navegar al chat con parámetro de búsqueda
    router.push(
      `/conversaciones/chat/${chatIdStr}?botId=${botIdStr}&fromSearch=true`,
    );
  };

  const handlePageChange = async (botId, newPage) => {
    await fetchConversations(botId, newPage);
  };

  const selectedBot = selectedBotId
    ? bots.find((bot) => String(bot.id) === String(selectedBotId))
    : null;

  const selectedBotConversations = selectedBotId
    ? conversations[selectedBotId] || []
    : [];

  const selectedBotPagination = selectedBotId
    ? conversationsPagination[selectedBotId] || {
        currentPage: 1,
        totalPages: 0,
        total: 0,
      }
    : { currentPage: 1, totalPages: 0, total: 0 };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const totalConversations = bots.reduce(
    (sum, bot) => sum + (bot.conversation_count || 0),
    0,
  );

  const activeFilterPills = getActiveFilterPills();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal de Ventas */}
      {salesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Ventas Concretadas
                </h3>
                <p className="text-sm text-gray-500">
                  Conversaciones con venta confirmada por IA
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseSalesModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Total: <strong>{salesConversations.length}</strong> ventas
                registradas
              </span>
              <span className="text-gray-500 flex items-center gap-1">
                <ArrowUp className="h-4 w-4 text-green-500" />
                Actualizado en tiempo real con IA
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {salesModalLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  Cargando ventas...
                </div>
              ) : salesModalError ? (
                <div className="px-6 py-8 text-center text-red-600">
                  {salesModalError}
                </div>
              ) : salesConversations.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  No se encontraron ventas concretadas todavía.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {salesConversations.map((sale) => (
                    <li
                      key={sale.id}
                      className="px-6 py-4 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {sale.displayName} · {sale.displayPhone}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-3">
                          <span>Asesor: {sale.advisorName}</span>
                          <span className="text-gray-300">•</span>
                          <span>{sale.formattedDate}</span>
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleCloseSalesModal();
                            router.push(
                              `/conversaciones/chat/${sale.id}?botId=${sale.bot?.id || sale.bot_id}`,
                            );
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100"
                        >
                          Ver conversación
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Mostrando las conversaciones donde la IA marcó{" "}
                <strong>sale_completed = true</strong>
              </p>
              <button
                type="button"
                onClick={handleCloseSalesModal}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sincronización */}
      {syncProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Sincronización Completa
                </h3>
                <p className="text-sm text-gray-500">
                  Conectando con Express y WAHA
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseSyncModal}
                className={`text-gray-400 hover:text-gray-600 ${syncingAll ? "pointer-events-none opacity-50" : ""}`}
                disabled={syncingAll}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {syncProgress.status}
              </p>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${Math.min(syncProgress.percent, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-4">
              <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 text-sm max-h-64 overflow-y-auto">
                {syncLogs.length === 0 ? (
                  <p className="text-gray-500 text-center">
                    Esperando actualizaciones...
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {syncLogs.map((log, index) => (
                      <li
                        key={`${log.time}-${index}`}
                        className="flex items-start gap-2"
                      >
                        <span className="text-[11px] text-gray-400">
                          {log.time}
                        </span>
                        <span
                          className={`text-sm ${log.type === "error" ? "text-red-600" : "text-gray-700"}`}
                        >
                          {log.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                La sincronización puede tardar varios minutos dependiendo de la
                cantidad de bots.
              </p>
              <button
                type="button"
                onClick={handleCloseSyncModal}
                disabled={syncingAll}
                className={`px-4 py-2 rounded-lg border text-sm transition ${
                  syncingAll
                    ? "border-gray-300 text-gray-400"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => router.push("/conversaciones/ai-insights")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Brain className="h-4 w-4" />
            AI Insights
          </button>
          <button
            type="button"
            onClick={() => setCompactMode((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 bg-white text-xs text-gray-700 hover:bg-gray-50"
          >
            Modo: {compactMode ? "Compacto" : "Detallado"}
          </button>
        </div>

        {/* Stats */}
        {!compactMode && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <button
              type="button"
              onClick={handleSalesClick}
              className="bg-white rounded-lg shadow p-6 text-left transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <ArrowUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Ventas Concretadas
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900 flex items-center gap-2">
                      {loadingSales ? (
                        <RefreshCw className="h-5 w-5 text-green-500 animate-spin" />
                      ) : (
                        <span translate="no">{salesCount}</span>
                      )}
                    </dd>
                    <dd className="text-xs text-green-600 mt-1">
                      Click para ver detalles
                    </dd>
                  </dl>
                </div>
              </div>
            </button>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Bots
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900" translate="no">
                      {bots.length}
                    </dd>
                    {activeFiltersCount() > 0 && (
                      <dd className="text-xs text-indigo-600 mt-1">
                        {getAllFilteredBots().length} mostrados
                      </dd>
                    )}
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Conversaciones
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900" translate="no">
                      {totalConversations}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Bots Activos
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900" translate="no">
                      {
                        bots.filter(
                          (bot) =>
                            bot.status === "WORKING" ||
                            bot.status === "ACTIVE" ||
                            bot.status === "working" ||
                            bot.status === "active",
                        ).length
                      }
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Filtros</h2>
              {activeFiltersCount() > 0 && (
                <span className="hidden md:inline text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {activeFiltersCount()} filtro
                  {activeFiltersCount() > 1 ? "s" : ""} activo
                  {activeFiltersCount() > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount() > 0 && !showFilters && (
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-600">
                  <span className="truncate max-w-[140px] sm:max-w-xs">
                    {getAllFilteredBots().length} de {bots.length} asesores
                  </span>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 text-[11px] sm:text-xs"
                  >
                    <Trash2 className="h-3 w-3" />
                    Limpiar
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-600"
              >
                {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                {showFilters ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          {activeFilterPills.length > 0 && (
            <div className="px-6 py-2 border-b border-gray-100 flex flex-wrap gap-2 text-[11px] text-gray-600">
              {activeFilterPills.map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => handleRemoveFilter(pill.key)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] ${getFilterPillClasses(pill.key)}`}
                >
                  <span>{pill.label}</span>
                  <span className="text-xs">×</span>
                </button>
              ))}
            </div>
          )}
          <div className={`px-6 py-4 ${showFilters ? "block" : "hidden"}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro de búsqueda global */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Búsqueda Global
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Buscar por nombre, teléfono..."
                    className="w-full pl-10 pr-4 py-2 bg-white text-gray-700 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Filtro de estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>

              {/* Filtro de líder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Líder
                </label>
                <select
                  value={leaderFilter}
                  onChange={(e) => setLeaderFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Todos</option>
                  <option value="moises">Moisés</option>
                  <option value="jesus">Jesús</option>
                  <option value="endry">Endry</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead
                </label>
                <select
                  value={leadFilter}
                  onChange={(e) => setLeadFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Todos</option>
                  <option value="colombia">Colombia</option>
                  <option value="venezuela">Venezuela</option>
                </select>
              </div>

              {/* Filtro de sede */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sede
                </label>
                <select
                  value={sedeFilter}
                  onChange={(e) => setSedeFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Todas</option>
                  <option value="nova">Nova</option>
                  <option value="apolo">Apolo</option>
                  <option value="flash">Flash</option>
                </select>
              </div>
            </div>

            {/* Botón para limpiar filtros y contador */}
            <div className="mt-4 flex items-center justify-between">
              {activeFiltersCount() > 0 && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {getAllFilteredBots().length} de {bots.length} asesores
                    {activeFiltersCount() > 0 &&
                      ` (${activeFiltersCount()} filtro${
                        activeFiltersCount() > 1 ? "s" : ""
                      } activo${activeFiltersCount() > 1 ? "s" : ""})`}
                  </span>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Layout principal: lista de asesores a la izquierda y conversaciones a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo: lista de asesores (bots) */}
          <section className="bg-white shadow rounded-lg flex flex-col lg:col-span-1">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    <span>Asesores</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona un asesor para ver sus conversaciones.
                  </p>
                </div>
                {getAllFilteredBots().length > 0 && (
                  <span className="text-xs text-gray-500">
                    {getAllFilteredBots().length} de {bots.length} visibles
                  </span>
                )}
              </div>
              
              {/* Buscador de asesores */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={botSearchQuery}
                  onChange={(e) => setBotSearchQuery(e.target.value)}
                  placeholder="Buscar asesor..."
                  className="w-full pl-10 pr-10 py-2 bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                {botSearchQuery && (
                  <button
                    onClick={() => setBotSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {getAllFilteredBots().length === 0 ? (
              <div className="flex-1 px-6 py-12 text-center flex flex-col items-center justify-center">
                <Bot className="mx-auto h-10 w-10 text-gray-300" />
                <h3 className="mt-3 text-sm font-medium text-gray-900">
                  No se encontraron asesores
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Ajusta los filtros para ver otros resultados.
                </p>
              </div>
            ) : (
              <div className="flex-1 max-h-[50vh] lg:max-h-[650px] overflow-y-auto divide-y divide-gray-100">
                {getAllFilteredBots().map((bot) => {
                  const botIsActive = isBotActive(bot.status);
                  const formattedStatus = formatBotStatus(bot.status);
                  const isSelected = String(bot.id) === String(selectedBotId);
                  const meta = parseBotSessionName(bot.session_name);

                  return (
                    <button
                      key={bot.id}
                      type="button"
                      onClick={() => handleBotSelect(bot.id)}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors border-l-4 ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-500"
                          : "border-transparent hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              botIsActive ? "bg-green-100" : "bg-gray-200"
                            }`}
                          >
                            <Bot
                              className={`h-5 w-5 ${
                                botIsActive ? "text-green-600" : "text-gray-600"
                              }`}
                            />
                          </div>
                          {botIsActive && (
                            <Circle
                              className="absolute -top-0.5 -right-0.5 h-3 w-3 text-green-500 fill-current"
                              strokeWidth={3}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate" translate="no">
                            {meta.displayName}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-500">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full border ${
                                botIsActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-gray-50 text-gray-600 border-gray-200"
                              }`}
                            >
                              <span translate="no">{formattedStatus}</span>
                            </span>
                            {meta.sedeLabel && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <span translate="no">{meta.sedeLabel}</span>
                              </span>
                            )}
                            {meta.leadLabel && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                <span translate="no">{meta.leadLabel}</span>
                              </span>
                            )}
                            {meta.leaderLabel && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                                <span translate="no">{meta.leaderLabel}</span>
                              </span>
                            )}
                            {bot.phone_number && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span className="truncate max-w-[120px]">
                                <span translate="no">{bot.phone_number}</span>
                              </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Comentado: Contadores de conversaciones y cotizaciones para simplificar la UI
                      <div className="flex flex-col items-end flex-shrink-0 gap-1">
                        <span className="text-sm font-semibold text-gray-900">
                          <span translate="no">{bot.conversation_count || 0}</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          <span>Conversaciones</span>
                        </span>
                        {botCotizaciones[bot.id] > 0 && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-medium border border-green-200 cursor-help"
                            title={`${botCotizaciones[bot.id]} cotización(es) enviadas`}
                          >
                            <FileText className="h-3 w-3" />
                            {botCotizaciones[bot.id]}
                          </span>
                        )}
                      </div>
                      */}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Panel derecho: conversaciones del bot seleccionado */}
          <section className="bg-white shadow rounded-lg flex flex-col lg:col-span-2">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              {selectedBot ? (
                (() => {
                  const meta = parseBotSessionName(selectedBot.session_name);
                  return (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        <span>Conversaciones de </span>
                        <span translate="no">{meta.displayName}</span>
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedBotPagination.total > 0 ? (
                          <span translate="no">{selectedBotPagination.total}</span>
                        ) : (
                          <span translate="no">{selectedBot.conversation_count || 0}</span>
                        )}
                        <span> conversaciones totales</span>
                        {selectedBotPagination.totalPages > 1 && (
                          <>
                            <span> • Mostrando página </span>
                            <span translate="no">{selectedBotPagination.currentPage}</span>
                            <span> de </span>
                            <span translate="no">{selectedBotPagination.totalPages}</span>
                          </>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-gray-600">
                        {meta.sedeLabel && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <span>Sede: </span>
                            <span translate="no">{meta.sedeLabel}</span>
                          </span>
                        )}
                        {meta.leadLabel && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <span>Lead: </span>
                            <span translate="no">{meta.leadLabel}</span>
                          </span>
                        )}
                        {meta.leaderLabel && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                            <span>Líder: </span>
                            <span translate="no">{meta.leaderLabel}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    <span>Conversaciones</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    <span>Selecciona un asesor en la lista para ver sus conversaciones.</span>
                  </p>
                </div>
              )}

              {selectedBot && (
                <div className="flex flex-col items-end gap-3">
                  <div className="flex flex-col items-end text-xs text-gray-500">
                    <span>Estado: </span>
                    <span translate="no">{formatBotStatus(selectedBot.status)}</span>
                    {selectedBot.phone_number && (
                      <span className="flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        <span translate="no">{selectedBot.phone_number}</span>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setReportData(null);
                      setReportError(null);
                      setReportModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow"
                  >
                    <FileText className="h-4 w-4" />
                    Generar reporte
                  </button>
                </div>
              )}
            </div>

            {/* Buscador Global */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => handleGlobalSearch(e.target.value)}
                  placeholder="Buscar por nombre, teléfono o palabra clave..."
                  className="w-full pl-10 pr-10 py-3 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
                {globalSearchQuery && (
                  <button
                    onClick={handleClearGlobalSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              {loadingGlobalSearch && (
                <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Buscando...</span>
                </div>
              )}
              {isGlobalSearchActive && !loadingGlobalSearch && (
                <div className="mt-2 text-sm text-gray-600">
                  {globalSearchResults.length} resultado
                  {globalSearchResults.length !== 1 ? "s" : ""} encontrado
                  {globalSearchResults.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>

            <div className="flex-1">
              {isGlobalSearchActive ? (
                /* Mostrar resultados de búsqueda global */
                loadingGlobalSearch ? (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500 gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Buscando conversaciones...
                  </div>
                ) : globalSearchResults.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center px-6 py-12">
                    <div>
                      <Search className="mx-auto h-10 w-10 text-gray-300" />
                      <h3 className="mt-3 text-sm font-medium text-gray-900">
                        No se encontraron resultados
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 max-w-md">
                        No hay conversaciones que coincidan con "
                        {globalSearchQuery}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[50vh] lg:max-h-[450px] overflow-y-auto divide-y divide-gray-200">
                    {globalSearchResults.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => handleGlobalSearchResultClick(chat)}
                        className={`px-6 py-4 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                          lastChatId === String(chat.id)
                            ? "bg-indigo-50 hover:bg-indigo-100"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center min-w-0 flex-1 gap-4">
                          <ContactAvatar
                            profilePictureUrl={chat.contact_profile_picture_url}
                            contactName={chat.contact_name || "Sin nombre"}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              <HighlightText
                                text={chat.contact_name || "Sin nombre"}
                                searchQuery={globalSearchQuery}
                                className="text-gray-900"
                              />
                            </p>

                            {/* Preview del mensaje si hay coincidencia en mensajes */}
                            {chat.match_message ? (
                              <div className="flex items-start gap-1 mt-0.5 text-xs text-gray-600">
                                <CheckCheck className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">
                                  <HighlightText
                                    text={chat.match_message}
                                    searchQuery={globalSearchQuery}
                                    className="text-gray-600"
                                  />
                                </span>
                              </div>
                            ) : (
                              /* Si no hay mensaje, mostrar teléfono y bot */
                              <div className="flex items-center gap-2 mt-0.5 text-xs">
                                <Phone className="h-3 w-3 text-gray-500" />
                                <span className="truncate max-w-[120px]">
                                  <HighlightText
                                    text={chat.contact_phone}
                                    searchQuery={globalSearchQuery}
                                    className="text-gray-500"
                                  />
                                </span>
                                <span className="text-gray-400">•</span>
                                <Bot className="h-3 w-3 text-gray-500" />
                                <span className="truncate max-w-[120px] text-gray-500">
                                  {chat.bot_name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 text-xs text-gray-500">
                          {chat.last_message_time && (
                            <span>
                              {new Date(
                                chat.last_message_time,
                              ).toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : !selectedBot ? (
                <div className="h-full flex items-center justify-center text-center px-6 py-12">
                  <div>
                    <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
                    <h3 className="mt-3 text-sm font-medium text-gray-900">
                      No hay asesor seleccionado
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 max-w-md">
                      Usa la lista de la izquierda para elegir un asesor y ver
                      el detalle de sus conversaciones.
                    </p>
                  </div>
                </div>
              ) : loadingConversations[selectedBotId] ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-500 gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Cargando conversaciones...
                </div>
              ) : selectedBotConversations.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center px-6 py-12">
                  <div>
                    <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
                    <h3 className="mt-3 text-sm font-medium text-gray-900">
                      No hay conversaciones para este asesor
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 max-w-md">
                      Las conversaciones aparecerán aquí cuando el bot reciba
                      mensajes de clientes.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="max-h-[50vh] lg:max-h-[450px] overflow-y-auto divide-y divide-gray-200">
                    {selectedBotConversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() =>
                          handleConversationClick(selectedBot.id, conv.id)
                        }
                        className={`px-6 py-4 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                          lastChatId === String(conv.id)
                            ? "bg-indigo-50 hover:bg-indigo-100"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center min-w-0 flex-1 gap-4">
                          <ContactAvatar
                            profilePictureUrl={conv.contact_profile_picture_url}
                            contactName={conv.contact_name || "Sin nombre"}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conv.contact_name || "Sin nombre"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                              <Phone className="h-3 w-3" />
                              <span className="truncate max-w-[160px]">
                                {conv.contact_phone || conv.remote_jid}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 text-xs text-gray-500 gap-1">
                          {/* Indicador IA - Solo mostrar si hay análisis real (sale_completed definido) */}
                          {conv.ai_analysis &&
                            conv.ai_analysis.sale_completed !== undefined && (
                              <div
                                className="mb-1"
                                title={
                                  conv.ai_analysis.sale_completed
                                    ? "Venta Probable"
                                    : "Venta Improbable"
                                }
                              >
                                {conv.ai_analysis.sale_completed ? (
                                  <div className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                                    <ArrowUp className="h-3 w-3" />
                                    <span className="font-bold text-xs">
                                      Venta
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                    <ArrowDown className="h-3 w-3" />
                                    <span className="font-bold text-xs">
                                      No Venta
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                          {/* Comentado: Contadores de métricas y mensajes para simplificar la UI
                          {conv.conversation_metrics?.response && (
                            <div
                              className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200"
                              title="Tiempo promedio de respuesta del asesor"
                            >
                              <Clock3 className="h-3 w-3 text-indigo-500" />
                              <span>
                                {formatResponseTime(
                                  conv.conversation_metrics.response
                                    .averageMinutes,
                                )}{" "}
                                avg
                              </span>
                            </div>
                          )}

                          {conv.conversation_metrics?.paymentMentions && (
                            <div
                              className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"
                              title="La conversación menciona pagos o métodos de pago"
                            >
                              <CreditCard className="h-3 w-3" />
                              <span>
                                {
                                  conv.conversation_metrics.paymentMentions
                                    .count
                                }{" "}
                                mención(es)
                              </span>
                            </div>
                          )}

                          {conv.conversation_metrics?.cotizacionMentions && (
                            <div
                              className="flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 cursor-help"
                              title={`Cotizaciones enviadas: ${conv.conversation_metrics.cotizacionMentions.files.join(', ')}`}
                            >
                              <FileText className="h-3 w-3" />
                              <span>
                                {conv.conversation_metrics.cotizacionMentions.count}{" "}
                                cotización(es)
                              </span>
                            </div>
                          )}

                          <span className="text-sm font-semibold text-gray-900">
                            {conv.message_count || 0} mensajes
                          </span>
                          */}
                          {conv.last_message_time && (
                            <span className="mt-0.5">
                              {new Date(
                                conv.last_message_time,
                              ).toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Controles de paginación */}
                  {selectedBotPagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>
                          Página {selectedBotPagination.currentPage} de{" "}
                          {selectedBotPagination.totalPages}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({selectedBotPagination.total} conversaciones totales)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handlePageChange(
                              selectedBotId,
                              selectedBotPagination.currentPage - 1,
                            )
                          }
                          disabled={
                            selectedBotPagination.currentPage === 1 ||
                            loadingConversations[selectedBotId]
                          }
                          className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedBotPagination.currentPage === 1 ||
                            loadingConversations[selectedBotId]
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                          }`}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </button>
                        <button
                          onClick={() =>
                            handlePageChange(
                              selectedBotId,
                              selectedBotPagination.currentPage + 1,
                            )
                          }
                          disabled={
                            selectedBotPagination.currentPage ===
                              selectedBotPagination.totalPages ||
                            loadingConversations[selectedBotId]
                          }
                          className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedBotPagination.currentPage ===
                              selectedBotPagination.totalPages ||
                            loadingConversations[selectedBotId]
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                          }`}
                        >
                          Siguiente
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeReportModal}
          ></div>
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">
                  Reporte IA
                </p>
                <h3 className="text-2xl font-semibold text-slate-900">
                  Generar reporte del asesor
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Analizaremos todas las conversaciones recientes para
                  identificar aciertos, riesgos y oportunidades.
                </p>
              </div>
              <button
                onClick={closeReportModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                disabled={reportLoading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 mb-2">
                  <Edit3 className="h-4 w-4 text-purple-600" />
                  Prompt para IA
                </div>
                <textarea
                  value={reportPrompt}
                  onChange={(e) => setReportPrompt(e.target.value)}
                  className="w-full min-h-[140px] rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:ring-4 focus:ring-purple-100 focus:border-purple-300"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Puedes personalizar el enfoque del reporte agregando
                  instrucciones específicas (productos, campañas, etc.).
                </p>
              </div>

              {reportError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {reportError}
                </div>
              )}

              {reportData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                      <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">
                        Conversaciones
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {reportData.summary?.totalChats ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                      <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">
                        Ventas logradas
                      </p>
                      <p className="mt-2 text-2xl font-bold text-emerald-700">
                        {reportData.summary?.salesCompleted ?? 0}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                      <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">
                        Promedio respuesta
                      </p>
                      <p className="mt-2 text-2xl font-bold text-indigo-700">
                        {reportData.summary?.averageResponseMinutes
                          ? `${reportData.summary.averageResponseMinutes} min`
                          : "N/D"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4">
                      <h4 className="text-sm font-semibold text-purple-800 mb-2 uppercase tracking-[0.2em]">
                        Momentos destacados
                      </h4>
                      <div className="space-y-3 text-sm text-slate-700">
                        {reportData.evidence?.highlightedWins?.length ? (
                          reportData.evidence.highlightedWins.map(
                            (item, idx) => (
                              <div
                                key={`win-${idx}`}
                                className="rounded-xl border border-white/70 bg-white px-3 py-2 shadow-sm"
                              >
                                <p className="font-semibold text-slate-900">
                                  {item.contact} · {item.responseMinutes} min
                                </p>
                                <p className="text-xs text-slate-500">
                                  Cliente: {item.clientSnippet}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Asesor: {item.advisorSnippet}
                                </p>
                              </div>
                            ),
                          )
                        ) : (
                          <p className="text-xs text-slate-500">
                            Aún no hay registros.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
                      <h4 className="text-sm font-semibold text-amber-800 mb-2 uppercase tracking-[0.2em]">
                        Respuestas tardías
                      </h4>
                      <div className="space-y-3 text-sm text-slate-700">
                        {reportData.evidence?.lateResponses?.length ? (
                          reportData.evidence.lateResponses.map((item, idx) => (
                            <div
                              key={`late-${idx}`}
                              className="rounded-xl border border-amber-100 bg-white px-3 py-2 shadow-sm"
                            >
                              <p className="font-semibold text-slate-900">
                                {item.contact} · {item.responseMinutes} min
                              </p>
                              <p className="text-xs text-slate-500">
                                Cliente: {item.clientSnippet}
                              </p>
                              <p className="text-xs text-slate-500">
                                Asesor: {item.advisorSnippet}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500">
                            Sin demoras relevantes.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-800 mb-2 uppercase tracking-[0.2em]">
                      Motivos de mejora detectados
                    </h4>
                    <div className="space-y-2 text-sm text-slate-700">
                      {reportData.evidence?.improvementReasons?.length ? (
                        reportData.evidence.improvementReasons.map(
                          (item, idx) => (
                            <p key={`improve-${idx}`}>
                              <span className="font-semibold text-slate-900">
                                {item.contact}:
                              </span>{" "}
                              {item.reason}
                            </p>
                          ),
                        )
                      ) : (
                        <p className="text-xs text-slate-500">
                          Sin observaciones registradas.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                El reporte se descargará en PDF automáticamente al generarse.
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={closeReportModal}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                  disabled={reportLoading}
                >
                  Cancelar
                </button>
                {reportData && (
                  <button
                    onClick={() =>
                      generatePdfReport(reportData, selectedBot?.session_name)
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50"
                  >
                    <Download className="h-4 w-4" />
                    Descargar PDF
                  </button>
                )}
                <button
                  onClick={handleGenerateReport}
                  disabled={reportLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60"
                >
                  {reportLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generar PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
