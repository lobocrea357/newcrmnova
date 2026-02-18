'use client'
import { useState, useEffect, Suspense } from 'react'
import { jsPDF } from 'jspdf'
import {
  supabase,
  getAllWorkers,
  getConversationsByBot,
  globalSearchChats,
  getCompletedSalesCount,
  getCompletedSalesConversations
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
  const [reportPrompt, setReportPrompt] = useState(`Eres un director comercial senior. Bajo ningún motivo inventes datos.
Analiza TODAS las conversaciones del asesor y elabora un reporte ejecutivo con:
- Resumen ejecutivo con métricas fuertes.
- Momentos destacados (ventas logradas o buenas respuestas) citando fragmentos.
- Momentos con demoras o riesgos, citando fragmentos y tiempos.
- Razones de no venta u oportunidades de mejora.
- Recomendaciones accionables para el equipo.

El tono debe ser profesional y directo.`);
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
      const response = await fetch(`${apiUrl}/api/sync/${sessionName}/all`, {
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
      const response = await fetch(`${apiUrl}/api/full-sync/all-bots`, {
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
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 15;
    const contentWidth = pageWidth - marginX * 2;
    let cursorY = 42;

    const ensureSpace = (space = 12) => {
      if (cursorY + space > 280) {
        doc.addPage();
        cursorY = 20;
      }
    };

    const addParagraph = (text) => {
      if (!text) return;
      const lines = doc.splitTextToSize(text, contentWidth);
      lines.forEach((line) => {
        ensureSpace(6);
        doc.text(line, marginX, cursorY);
        cursorY += 6;
      });
      cursorY += 2;
    };

    const addSectionTitle = (title, subtitle) => {
      ensureSpace(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(40, 44, 60);
      doc.text(title, marginX, cursorY);
      cursorY += 5;
      if (subtitle) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(106, 109, 122);
        doc.text(subtitle, marginX, cursorY);
        cursorY += 6;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(39, 40, 45);
    };

    const drawStatsGrid = (items) => {
      if (!items.length) return;
      const cardWidth = (contentWidth - 8) / 2;
      let column = 0;
      items.forEach((item) => {
        ensureSpace(28);
        const x = marginX + column * (cardWidth + 8);
        doc.setDrawColor(215, 218, 245);
        doc.setFillColor(247, 248, 255);
        doc.roundedRect(x, cursorY, cardWidth, 24, 3, 3, "FD");
        doc.setTextColor(116, 120, 138);
        doc.setFontSize(8);
        doc.text(item.label, x + 4, cursorY + 8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(34, 34, 44);
        doc.text(String(item.value ?? "—"), x + 4, cursorY + 18);
        doc.setFont("helvetica", "normal");
        column += 1;
        if (column === 2) {
          column = 0;
          cursorY += 28;
        }
      });
      if (column !== 0) {
        cursorY += 28;
      }
      doc.setTextColor(40, 44, 60);
    };

    const drawChatSection = (title, items, palette) => {
      if (!items || !items.length) return;
      addSectionTitle(title);
      const cardWidth = contentWidth;
      items.forEach((item, idx) => {
        const metaParts = [];
        if (item.contact) metaParts.push(item.contact);
        if (item.responseMinutes !== undefined)
          metaParts.push(`${item.responseMinutes} min`);
        const meta = metaParts.join(" · ") || `Caso ${idx + 1}`;
        const clientText = item.clientSnippet
          ? `Cliente: ${item.clientSnippet}`
          : item.reason
            ? item.reason
            : "";
        const advisorText = item.advisorSnippet ? item.advisorSnippet : "";
        const clientLines = clientText
          ? doc.splitTextToSize(clientText, cardWidth - 20)
          : [];
        const advisorLines = advisorText
          ? doc.splitTextToSize(`Asesor: ${advisorText}`, cardWidth - 24)
          : [];
        const clientHeight = clientLines.length
          ? clientLines.length * 5 + 10
          : 0;
        const advisorHeight = advisorLines.length
          ? advisorLines.length * 5 + 10
          : 0;
        const baseHeight =
          18 +
          clientHeight +
          advisorHeight +
          (clientHeight && advisorHeight ? 4 : 0);

        ensureSpace(baseHeight + 10);
        doc.setDrawColor(...palette.border);
        doc.setFillColor(...palette.fill);
        doc.roundedRect(marginX, cursorY, cardWidth, baseHeight, 4, 4, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(42, 44, 61);
        doc.text(meta, marginX + 4, cursorY + 7);
        let blockY = cursorY + 12;

        if (clientLines.length) {
          doc.setDrawColor(221, 228, 255);
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(
            marginX + 4,
            blockY,
            cardWidth - 8,
            clientHeight,
            3,
            3,
            "FD",
          );
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(78, 82, 120);
          doc.text("Cliente", marginX + 8, blockY + 5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 63, 92);
          let textY = blockY + 10;
          clientLines.forEach((line) => {
            doc.text(line, marginX + 8, textY);
            textY += 5;
          });
          blockY += clientHeight + 4;
        }

        if (advisorLines.length) {
          doc.setDrawColor(255, 222, 203);
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(
            marginX + 4,
            blockY,
            cardWidth - 8,
            advisorHeight,
            3,
            3,
            "FD",
          );
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(104, 74, 54);
          doc.text("Asesor", marginX + cardWidth - 12, blockY + 5, {
            align: "right",
          });
          doc.setFont("helvetica", "normal");
          doc.setTextColor(78, 62, 48);
          let textY = blockY + 10;
          advisorLines.forEach((line) => {
            doc.text(line, marginX + 8, textY);
            textY += 5;
          });
          blockY += advisorHeight + 4;
        }

        cursorY = blockY + 6;
        doc.setTextColor(39, 40, 45);
      });
    };

    // Header
    doc.setFillColor(36, 33, 93);
    doc.setDrawColor(36, 33, 93);
    doc.roundedRect(marginX, 15, contentWidth, 22, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(`Informe IA · ${advisorName || "Asesor"}`, marginX + 6, 29);
    doc.setFontSize(10);
    doc.text(
      new Date().toLocaleDateString("es-ES"),
      marginX + contentWidth - 6,
      29,
      {
        align: "right",
      },
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(39, 40, 45);

    const summary = payload.summary || {};
    const narrative = payload.aiNarrative || {};
    const summaryParagraph = `Se analizaron ${summary.totalChats ?? 0} conversaciones (${
      summary.totalMessages ?? 0
    } mensajes) para comprender el desempeño del asesor. Se confirmaron ${
      summary.salesCompleted ?? 0
    } ventas y se identificaron ${summary.salesFailed ?? 0} oportunidades perdidas. El tiempo de respuesta promedio fue de ${
      summary.averageResponseMinutes ?? "N/D"
    } minutos, con picos de hasta ${summary.worstResponseMinutes ?? "N/D"} minutos en los casos más lentos.`;
    addParagraph(summaryParagraph);

    drawStatsGrid([
      { label: "Conversaciones", value: summary.totalChats ?? "—" },
      { label: "Mensajes", value: summary.totalMessages ?? "—" },
      { label: "Ventas concretadas", value: summary.salesCompleted ?? 0 },
      { label: "Oportunidades perdidas", value: summary.salesFailed ?? 0 },
      {
        label: "Tiempo respuesta promedio",
        value: summary.averageResponseMinutes
          ? `${summary.averageResponseMinutes} min`
          : "N/D",
      },
      {
        label: "Respuesta más lenta",
        value: summary.worstResponseMinutes
          ? `${summary.worstResponseMinutes} min`
          : "N/D",
      },
    ]);

    addSectionTitle(
      "Narrativa general",
      "Resumen elaborado automáticamente por la IA",
    );
    addParagraph(
      cleanText(narrative.introduction || narrative.executive_summary || "") ||
        "No se pudo generar un resumen automático.",
    );

    const addFindings = () => {
      if (!Array.isArray(narrative.findings) || !narrative.findings.length)
        return;
      narrative.findings.forEach((finding, idx) => {
        addSectionTitle(
          `Hallazgo ${idx + 1}: ${cleanText(finding.title || "")}`,
        );
        addParagraph(cleanText(finding.description || ""));
        if (
          Array.isArray(finding.evidence_quotes) &&
          finding.evidence_quotes.length
        ) {
          finding.evidence_quotes.forEach((quote) =>
            addParagraph(`Cita: "${cleanText(quote)}"`),
          );
        }
        if (finding.impact) {
          addParagraph(`Impacto: ${cleanText(finding.impact)}`);
        }
      });
    };

    const addImprovements = () => {
      if (
        !Array.isArray(narrative.improvements) ||
        !narrative.improvements.length
      )
        return;
      narrative.improvements.forEach((improvement, idx) => {
        addSectionTitle(
          `Area de mejora ${idx + 1}: ${cleanText(improvement.title || "")}`,
        );
        if (Array.isArray(improvement.actions) && improvement.actions.length) {
          improvement.actions.forEach((action) =>
            addParagraph(`• ${cleanText(action)}`),
          );
        }
      });
    };

    addFindings();
    addImprovements();

    if (narrative.conclusion || narrative.closing_statement) {
      addSectionTitle("Conclusión y próximos pasos");
      addParagraph(
        cleanText(narrative.conclusion || narrative.closing_statement || ""),
      );
    }

    drawChatSection("Momentos destacados", payload.evidence?.highlightedWins, {
      fill: [244, 243, 255],
      border: [195, 188, 255],
    });

    drawChatSection("Respuestas con demora", payload.evidence?.lateResponses, {
      fill: [255, 247, 236],
      border: [253, 213, 152],
    });

    drawChatSection(
      "Oportunidades de mejora",
      (payload.evidence?.improvementReasons || []).map((item) => ({
        contact: item.contact,
        clientSnippet: item.reason,
      })),
      {
        fill: [242, 248, 248],
        border: [188, 218, 218],
      },
    );

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
                        salesCount
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
                    <dd className="text-3xl font-semibold text-gray-900">
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
                    <dd className="text-3xl font-semibold text-gray-900">
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
                    <dd className="text-3xl font-semibold text-gray-900">
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
                    Asesores
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
                          <p className="text-sm font-semibold text-gray-900 truncate">
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
                              {formattedStatus}
                            </span>
                            {meta.sedeLabel && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {meta.sedeLabel}
                              </span>
                            )}
                            {meta.leadLabel && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                {meta.leadLabel}
                              </span>
                            )}
                            {meta.leaderLabel && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                                {meta.leaderLabel}
                              </span>
                            )}
                            {bot.phone_number && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span className="truncate max-w-[120px]">
                                  {bot.phone_number}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-sm font-semibold text-gray-900">
                          {bot.conversation_count || 0}
                        </span>
                        <span className="text-xs text-gray-500">
                          Conversaciones
                        </span>
                      </div>
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
                        Conversaciones de {meta.displayName}
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedBotPagination.total > 0
                          ? `${selectedBotPagination.total} conversaciones totales`
                          : `${selectedBot.conversation_count || 0} conversaciones totales`}
                        {selectedBotPagination.totalPages > 1 &&
                          ` • Mostrando página ${selectedBotPagination.currentPage} de ${selectedBotPagination.totalPages}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-gray-600">
                        {meta.sedeLabel && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Sede: {meta.sedeLabel}
                          </span>
                        )}
                        {meta.leadLabel && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Lead: {meta.leadLabel}
                          </span>
                        )}
                        {meta.leaderLabel && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                            Líder: {meta.leaderLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Conversaciones
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona un asesor en la lista para ver sus
                    conversaciones.
                  </p>
                </div>
              )}

              {selectedBot && (
                <div className="flex flex-col items-end gap-3">
                  <div className="flex flex-col items-end text-xs text-gray-500">
                    <span>Estado: {formatBotStatus(selectedBot.status)}</span>
                    {selectedBot.phone_number && (
                      <span className="flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {selectedBot.phone_number}
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

                          <span className="text-sm font-semibold text-gray-900">
                            {conv.message_count || 0} mensajes
                          </span>
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
