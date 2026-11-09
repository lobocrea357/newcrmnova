/* Copia ESM de ai-auditor/evaluator.js — mismo motor para "Evaluar ahora". Mantener en sincronía. */
/**
 * Evaluador de conversaciones de venta (v2).
 *
 * - La IA (Gemini, salida JSON con esquema) solo responde HECHOS observables del
 *   chat: qué hizo el asesor y cómo terminó la conversación.
 * - El puntaje NO lo inventa la IA: se calcula aquí a partir de esos criterios con
 *   pesos fijos, así es comparable entre asesores y días.
 * - Los tiempos de respuesta se miden con los timestamps reales, no por la IA.
 */
import { SchemaType } from '@google/generative-ai';

const MODEL_NAME = process.env.AUDITOR_MODEL || 'gemini-3.5-flash';
const ANALYSIS_VERSION = 'v2';
const TZ = 'America/Caracas';
const MAX_MESSAGES = 160; // últimos N mensajes para acotar tokens

/** Criterios de calidad del asesor → columna en conversation_evaluations y peso. */
const CRITERIA = [
  { key: 'preguntas_negociacion', weight: 10, label: 'Entendió la necesidad (fechas, pasajeros, presupuesto)' },
  { key: 'cotizacion_enviada', weight: 15, label: 'Envió cotización' },
  { key: 'calidad_cotizacion', weight: 10, label: 'Cotización clara (ruta, fechas, precio, condiciones)' },
  { key: 'mas_dos_opciones', weight: 8, label: 'Ofreció 2 o más opciones' },
  { key: 'ofrecio_scalapay', weight: 7, label: 'Ofreció financiamiento (Scalapay)' },
  { key: 'valor_agregado', weight: 5, label: 'Aportó valor (equipaje, escalas, recomendaciones)' },
  { key: 'objeciones_superadas', weight: 10, label: 'Resolvió objeciones' },
  { key: 'urgencia_creada', weight: 5, label: 'Generó urgencia legítima (cupos, precio)' },
  { key: 'cierre_intencion', weight: 10, label: 'Intentó cerrar la venta' },
  { key: 'metodo_pago_enviado', weight: 5, label: 'Envió método de pago' },
  { key: 'seguimiento_intencion', weight: 5, label: 'Hizo seguimiento' },
];
// + tiempo_respuesta (10 pts) medido con timestamps.
const RESPONSE_WEIGHT = 10;
const MAX_SCORE = CRITERIA.reduce((s, c) => s + c.weight, 0) + RESPONSE_WEIGHT; // 100

const SYSTEM_PROMPT = `Eres auditor de calidad comercial de una agencia de viajes que vende boletos aéreos por WhatsApp (Venezuela, Colombia, España).
Lees la conversación completa entre un ASESOR y un CLIENTE y respondes solo con hechos que se puedan comprobar en el chat.

Reglas:
- Marca un criterio como true solo si hay evidencia explícita en los mensajes del asesor. Ante la duda, false.
- "venta_confirmada" es true únicamente si hay confirmación de pago Y emisión del boleto (o envío del boleto/localizador).
- "estado": vendida | en_negociacion | perdida | sin_respuesta | no_aplica. Usa no_aplica si el chat no es una consulta de venta (spam, proveedor, conversación personal, trámite interno).
- "motivo_perdida": la causa concreta si estado = perdida o sin_respuesta (precio, fechas, no respondió el cliente, demora del asesor, eligió otra agencia…). Vacío si no aplica.
- "errores_criticos": fallos del asesor que costaron o arriesgan la venta, frases cortas y concretas. Máximo 4.
- "exitos": lo que el asesor hizo bien, frases cortas. Máximo 4.
- "siguiente_accion": la acción concreta que debería hacer el asesor ahora (una frase). Vacío si la venta está cerrada o no aplica.
- "resumen": 2 o 3 frases para un gerente: qué pidió el cliente, qué pasó y cómo terminó.
- "valor_estimado_usd": monto total cotizado o vendido en USD si aparece (convierte solo si la moneda es clara), si no, 0.
- "confianza": 0 a 1, qué tan seguro estás de la evaluación (baja si el chat es corto o ambiguo).
- Escribe en español neutro, sin adornos.`;

const bool = { type: SchemaType.BOOLEAN };
const str = { type: SchemaType.STRING };
const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    criterios: {
      type: SchemaType.OBJECT,
      properties: Object.fromEntries(CRITERIA.map((c) => [c.key, bool])),
      required: CRITERIA.map((c) => c.key),
    },
    lead_respondio: bool,
    venta_confirmada: bool,
    lead_caliente: bool,
    nivel_interes: { type: SchemaType.STRING, enum: ['alto', 'medio', 'bajo', 'nulo'] },
    estado: { type: SchemaType.STRING, enum: ['vendida', 'en_negociacion', 'perdida', 'sin_respuesta', 'no_aplica'] },
    motivo_perdida: str,
    destino: str,
    errores_criticos: { type: SchemaType.ARRAY, items: str },
    exitos: { type: SchemaType.ARRAY, items: str },
    siguiente_accion: str,
    resumen: str,
    valor_estimado_usd: { type: SchemaType.NUMBER },
    confianza: { type: SchemaType.NUMBER },
  },
  required: ['criterios', 'lead_respondio', 'venta_confirmada', 'lead_caliente', 'nivel_interes', 'estado',
    'motivo_perdida', 'errores_criticos', 'exitos', 'siguiente_accion', 'resumen', 'valor_estimado_usd', 'confianza'],
};

function createModel(genAI) {
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  });
}

const fmt = new Intl.DateTimeFormat('es-VE', { timeZone: TZ, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });

/** Texto legible de un mensaje: cuerpo, transcripción de audio o leyenda de media. */
function messageText(m) {
  const t = m.metadata && typeof m.metadata === 'object' ? m.metadata.transcription : null;
  if (t) return `[Audio] ${t}`;
  if (m.body && String(m.body).trim()) return String(m.body).trim();
  if (m.caption) return `[${m.type || 'Archivo'}] ${m.caption}`;
  return `[${m.type || 'Multimedia'}]`;
}

/** Tiempos de primera respuesta del asesor tras cada mensaje del cliente (minutos). */
function responseStats(messages) {
  const samples = [];
  let waitingSince = null;
  for (const m of messages) {
    const ts = new Date(m.timestamp).getTime();
    if (Number.isNaN(ts)) continue;
    if (!m.from_me) {
      if (waitingSince === null) waitingSince = ts;
    } else if (waitingSince !== null) {
      samples.push((ts - waitingSince) / 60000);
      waitingSince = null;
    }
  }
  if (!samples.length) return { avg: null, max: null, samples: 0 };
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  return { avg, max: Math.max(...samples), samples: samples.length };
}

function buildTranscript(messages) {
  const recent = messages.slice(-MAX_MESSAGES);
  const omitted = messages.length - recent.length;
  const lines = recent.map((m) => `[${fmt.format(new Date(m.timestamp))}] ${m.from_me ? 'ASESOR' : 'CLIENTE'}: ${messageText(m)}`);
  return (omitted > 0 ? `(${omitted} mensajes anteriores omitidos)\n` : '') + lines.join('\n');
}

/**
 * Evalúa un chat. Devuelve la fila lista para conversation_evaluations (sin ids
 * de relación) o null si falla.
 */
async function evaluateChat(model, messages) {
  const stats = responseStats(messages);
  const prompt = `Conversación (hora de Venezuela):\n---\n${buildTranscript(messages)}\n---\n` +
    `Datos medidos por el sistema: tiempo promedio de respuesta del asesor ${stats.avg === null ? 'sin datos' : Math.round(stats.avg) + ' min'}, ` +
    `máximo ${stats.max === null ? 'sin datos' : Math.round(stats.max) + ' min'}.`;

  const result = await model.generateContent(prompt);
  const ai = JSON.parse(result.response.text());

  // Respuesta rápida: promedio ≤ 15 min y ninguna espera > 60 min.
  const tiempoRespuesta = stats.avg !== null && stats.avg <= 15 && stats.max <= 60;
  let score = tiempoRespuesta ? RESPONSE_WEIGHT : 0;
  for (const c of CRITERIA) if (ai.criterios?.[c.key]) score += c.weight;
  const percentage = Math.round((score / MAX_SCORE) * 10000) / 100;

  const criterios = Object.fromEntries(CRITERIA.map((c) => [c.key, !!ai.criterios?.[c.key]]));
  const clean = (arr) => (Array.isArray(arr) ? arr.map((s) => String(s).trim()).filter(Boolean).slice(0, 4) : []);

  return {
    ...criterios,
    tiempo_respuesta: tiempoRespuesta,
    seguimiento_efectivo: criterios.seguimiento_intencion && !!ai.lead_respondio,
    lead_respondio: !!ai.lead_respondio,
    venta_confirmada: !!ai.venta_confirmada,
    lead_caliente: !!ai.lead_caliente,
    // La columna solo admite alto/medio/bajo (CHECK); 'nulo' se guarda vacío.
    interest_level: ['alto', 'medio', 'bajo'].includes(ai.nivel_interes) ? ai.nivel_interes : null,
    score,
    max_score: MAX_SCORE,
    percentage,
    score_ventas: ai.venta_confirmada ? 100 : ai.estado === 'en_negociacion' ? 50 : 0,
    valor_estimado: ai.valor_estimado_usd > 0 ? ai.valor_estimado_usd : null,
    errores_criticos: clean(ai.errores_criticos),
    exitos_asesor: clean(ai.exitos),
    siguiente_accion: ai.siguiente_accion?.trim() || null,
    ai_feedback: ai.resumen?.trim() || null,
    confidence_score: typeof ai.confianza === 'number' ? Math.max(0, Math.min(1, ai.confianza)) : null,
    resultado_comercial: {
      estado: ai.estado,
      motivo_perdida: ai.motivo_perdida || null,
      destino: ai.destino || null,
      tiempo_respuesta_promedio_min: stats.avg === null ? null : Math.round(stats.avg),
      tiempo_respuesta_max_min: stats.max === null ? null : Math.round(stats.max),
      mensajes: messages.length,
    },
    analysis_method: MODEL_NAME,
    analysis_version: ANALYSIS_VERSION,
    generated_by: 'system',
    _estado: ai.estado,
  };
}

export { createModel, evaluateChat, CRITERIA, MAX_SCORE, MODEL_NAME, RESPONSE_WEIGHT };
