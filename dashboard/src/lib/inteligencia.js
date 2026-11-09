/**
 * Datos del Centro IA. Las evaluaciones las produce la auditoría continua
 * (ai-auditor, Gemini) en `conversation_evaluations`; el gateway ya filtra por
 * rol (cada usuario ve solo las de sus bots).
 */
import { supabase } from '@/lib/supabase';
import { parseBotSessionName } from '@/lib/botNameParser';

/** Mismos criterios y pesos que ai-auditor/evaluator.js. */
export const CRITERIA = [
  { key: 'tiempo_respuesta', label: 'Respondió a tiempo', weight: 10 },
  { key: 'preguntas_negociacion', label: 'Entendió la necesidad', weight: 10 },
  { key: 'cotizacion_enviada', label: 'Envió cotización', weight: 15 },
  { key: 'calidad_cotizacion', label: 'Cotización clara', weight: 10 },
  { key: 'mas_dos_opciones', label: 'Dio 2 o más opciones', weight: 8 },
  { key: 'ofrecio_scalapay', label: 'Ofreció Scalapay', weight: 7 },
  { key: 'valor_agregado', label: 'Aportó valor', weight: 5 },
  { key: 'objeciones_superadas', label: 'Resolvió objeciones', weight: 10 },
  { key: 'urgencia_creada', label: 'Generó urgencia', weight: 5 },
  { key: 'cierre_intencion', label: 'Intentó cerrar', weight: 10 },
  { key: 'metodo_pago_enviado', label: 'Envió método de pago', weight: 5 },
  { key: 'seguimiento_intencion', label: 'Hizo seguimiento', weight: 5 },
];

export const ESTADOS = {
  vendida: { label: 'Vendida', tone: 'success' },
  en_negociacion: { label: 'En negociación', tone: 'nova' },
  perdida: { label: 'Perdida', tone: 'danger' },
  sin_respuesta: { label: 'Sin respuesta', tone: 'warning' },
  no_aplica: { label: 'No es venta', tone: 'neutral' },
  desconocido: { label: 'Sin clasificar', tone: 'neutral' },
};

export const INTERES = { alto: 'Alto', medio: 'Medio', bajo: 'Bajo', nulo: 'Nulo' };

export const PERIODS = [
  { id: 'hoy', label: 'Hoy', days: 0 },
  { id: '7d', label: '7 días', days: 7 },
  { id: '30d', label: '30 días', days: 30 },
];

const SELECT = [
  'id, chat_id, bot_id, evaluation_date, score, percentage, venta_confirmada, lead_caliente, interest_level',
  'resultado_comercial, errores_criticos, exitos_asesor, siguiente_accion, ai_feedback, valor_estimado',
  'confidence_score, analysis_version, analysis_method',
  CRITERIA.map((c) => c.key).join(', '),
  'bots(session_name), chats(contact_name, contact_number)',
].join(', ');

export function periodStart(periodId) {
  const p = PERIODS.find((x) => x.id === periodId) || PERIODS[1];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (p.days) d.setDate(d.getDate() - (p.days - 1));
  return d;
}

/** Normaliza evaluaciones v2 (columnas) y v1 (JSON en ai_feedback). */
export function normalizeEval(e) {
  let estado = e.resultado_comercial?.estado;
  let resumen = e.ai_feedback;
  let motivo = e.resultado_comercial?.motivo_perdida || null;
  let errores = e.errores_criticos || [];
  let exitos = e.exitos_asesor || [];
  let percentage = e.percentage != null ? Number(e.percentage) : null;

  if (e.analysis_version !== 'v2') {
    let legacy = null;
    try { legacy = JSON.parse(e.ai_feedback); } catch { /* texto plano */ }
    if (legacy) {
      estado = legacy.sale_completed ? 'vendida' : legacy.failure_reason && legacy.failure_reason !== 'N/A' ? 'perdida' : 'desconocido';
      resumen = legacy.advisor_performance || null;
      motivo = legacy.failure_reason && legacy.failure_reason !== 'N/A' ? legacy.failure_reason : null;
      exitos = exitos.length ? exitos : legacy.key_moments || [];
      // v1 puntuaba 1-10
      if (percentage == null || percentage === 0) percentage = legacy.score ? legacy.score * 10 : null;
    }
  }
  const bot = parseBotSessionName(e.bots?.session_name);
  return {
    ...e,
    estado: estado || (e.venta_confirmada ? 'vendida' : 'desconocido'),
    resumen,
    motivo,
    errores,
    exitos,
    percentage,
    asesor: bot.fullName,
    sede: bot.sedeLabel,
    cliente: e.chats?.contact_name || e.chats?.contact_number || 'Cliente',
    telefono: e.chats?.contact_number || null,
    valor: e.valor_estimado != null ? Number(e.valor_estimado) : null,
  };
}

export async function fetchEvaluaciones(periodId, { limit = 3000 } = {}) {
  const { data, error } = await supabase
    .from('conversation_evaluations')
    .select(SELECT)
    .gte('evaluation_date', periodStart(periodId).toISOString())
    .order('evaluation_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(normalizeEval);
}

export async function fetchEvaluacion(id) {
  const { data, error } = await supabase.from('conversation_evaluations').select(SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? normalizeEval(data) : null;
}

/** Última evaluación de un chat (para el panel dentro de la conversación). */
export async function fetchEvaluacionDeChat(chatId) {
  const { data, error } = await supabase
    .from('conversation_evaluations')
    .select(SELECT)
    .eq('chat_id', chatId)
    .order('evaluation_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeEval(data) : null;
}

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

/** Solo conversaciones de venta (excluye internas/spam). */
export const ventasReales = (evals) => evals.filter((e) => e.estado !== 'no_aplica');

export function resumen(evals) {
  const reales = ventasReales(evals);
  const vendidas = reales.filter((e) => e.estado === 'vendida');
  const enJuego = reales.filter((e) => e.estado === 'en_negociacion');
  const calientes = enJuego.filter((e) => e.lead_caliente || e.interest_level === 'alto');
  return {
    total: reales.length,
    calidad: avg(reales.map((e) => e.percentage).filter((v) => v != null)),
    vendidas: vendidas.length,
    conversion: reales.length ? (vendidas.length / reales.length) * 100 : null,
    enJuego: enJuego.length,
    calientes: calientes.length,
    valorEnJuego: enJuego.reduce((s, e) => s + (e.valor || 0), 0),
    valorVendido: vendidas.reduce((s, e) => s + (e.valor || 0), 0),
    noAplica: evals.length - reales.length,
  };
}

/** % de cumplimiento de cada criterio (solo evaluaciones v2, que los miden todos). */
export function cumplimiento(evals) {
  const v2 = ventasReales(evals).filter((e) => e.analysis_version === 'v2');
  return CRITERIA.map((c) => ({
    ...c,
    pct: v2.length ? (v2.filter((e) => e[c.key]).length / v2.length) * 100 : null,
    n: v2.length,
  }));
}

/** Frases repetidas (errores, motivos) agrupadas sin distinguir mayúsculas. */
export function topFrases(lists, max = 6) {
  const map = new Map();
  for (const s of lists.flat().filter(Boolean)) {
    const k = String(s).trim().toLowerCase().replace(/[.。]+$/, '');
    if (!k) continue;
    const cur = map.get(k) || { texto: String(s).trim().replace(/[.]+$/, ''), n: 0 };
    cur.n++;
    map.set(k, cur);
  }
  return [...map.values()].sort((a, b) => b.n - a.n).slice(0, max);
}

/** Agregado por asesor (bot). */
export function porAsesor(evals) {
  const groups = new Map();
  for (const e of ventasReales(evals)) {
    const g = groups.get(e.bot_id) || { bot_id: e.bot_id, asesor: e.asesor, sede: e.sede, evals: [] };
    g.evals.push(e);
    groups.set(e.bot_id, g);
  }
  return [...groups.values()].map((g) => {
    const r = resumen(g.evals);
    const crit = cumplimiento(g.evals).filter((c) => c.pct != null);
    const debil = crit.length ? crit.reduce((a, b) => (b.pct < a.pct ? b : a)) : null;
    return { ...g, ...r, debil };
  }).sort((a, b) => (b.calidad ?? -1) - (a.calidad ?? -1));
}

export const fmtPct = (v) => (v == null ? '—' : `${Math.round(v)}%`);
export const fmtUsd = (v) =>
  v ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '—';
export const fmtFecha = (d) =>
  d ? new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d)) : '';
