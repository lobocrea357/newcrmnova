'use client';

/**
 * Muestrario del sistema de diseño SOLO para desarrollo (404 en producción).
 * Permite revisar el kit y las piezas del Centro IA sin iniciar sesión.
 */
import { notFound } from 'next/navigation';
import { MessagesSquare, Gauge, BadgeCheck, Flame, Sparkles } from 'lucide-react';
import { Page, PageHeader, Panel, Stat, Badge, Button, Tabs, EmptyState, ScoreBar } from '@/components/ui/kit';
import { EvaluationCard, EstadoBadge, PctBadge } from '@/components/inteligencia/parts';
import { normalizeEval } from '@/lib/inteligencia';

const MOCK = normalizeEval({
  id: 'demo', chat_id: 'c1', bot_id: 'b1', evaluation_date: '2026-11-08T21:30:00.000Z',
  score: 63, percentage: 63, venta_confirmada: false, lead_caliente: true, interest_level: 'alto',
  analysis_version: 'v2', valor_estimado: 1180,
  resultado_comercial: { estado: 'en_negociacion', destino: 'Madrid', tiempo_respuesta_promedio_min: 6 },
  ai_feedback: 'La clienta pidió vuelos Caracas–Madrid para dos adultos en diciembre. El asesor envió dos opciones con precio y equipaje, pero no propuso cerrar ni ofreció financiamiento. Quedó pendiente de confirmar fechas.',
  siguiente_accion: 'Escribirle hoy para confirmar fechas y ofrecer reservar con Scalapay antes de que suba la tarifa.',
  errores_criticos: ['No intentó cerrar la venta tras enviar la cotización', 'No ofreció Scalapay'],
  exitos_asesor: ['Respondió en menos de 10 minutos', 'Envió dos opciones claras con equipaje incluido'],
  tiempo_respuesta: true, preguntas_negociacion: true, cotizacion_enviada: true, calidad_cotizacion: true,
  mas_dos_opciones: true, valor_agregado: true,
  bots: { session_name: 'yoselis_asesor_flash' }, chats: { contact_name: 'María Fernanda Ruiz', contact_number: '584121234567' },
});

export default function DevKit() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <Page wide>
      <PageHeader
        title="Centro IA"
        description="La IA revisa cada conversación de venta cuando se queda quieta 45 minutos: qué hizo bien el asesor, qué falló y cuál es el siguiente paso."
        actions={<><Button>Actualizar</Button><Button variant="primary">Evaluar ahora</Button></>}
      />
      <Tabs
        className="mb-6"
        active="resumen"
        tabs={[
          { id: 'resumen', label: 'Resumen', href: '#' },
          { id: 'asesores', label: 'Asesores', href: '#' },
          { id: 'conversaciones', label: 'Conversaciones', href: '#', count: 59 },
          { id: 'manual', label: 'Manual de ventas', href: '#' },
        ]}
      />
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Stat label="Conversaciones de venta" value="56" icon={MessagesSquare} hint="3 internas o sin intención de compra no cuentan" />
          <Stat label="Calidad media" value="31%" icon={Gauge} hint="Cumplimiento de los criterios de venta" />
          <Stat label="Ventas confirmadas" value="12" icon={BadgeCheck} tone="success" hint="Conversión 21%" />
          <Stat label="En negociación" value="37" icon={Flame} tone="warning" hint="9 con interés alto" />
        </div>
        <div className="grid gap-6 xl:grid-cols-5">
          <Panel className="xl:col-span-3" title="Ficha de evaluación" description="Así se ve una conversación evaluada">
            <EvaluationCard ev={MOCK} showChatLink />
          </Panel>
          <div className="space-y-6 xl:col-span-2">
            <Panel title="Etiquetas">
              <div className="flex flex-wrap gap-2">
                {['vendida', 'en_negociacion', 'perdida', 'sin_respuesta', 'no_aplica'].map((e) => <EstadoBadge key={e} estado={e} />)}
                <PctBadge value={82} /><PctBadge value={55} /><PctBadge value={20} />
                <Badge tone="info">US$1.180</Badge>
              </div>
            </Panel>
            <Panel title="Puntajes">
              <div className="space-y-3"><ScoreBar value={82} /><ScoreBar value={55} /><ScoreBar value={18} /></div>
            </Panel>
            <Panel><EmptyState icon={Sparkles} title="Todavía no hay conversaciones evaluadas" description="La IA evalúa los chats de venta cuando llevan 45 minutos sin mensajes nuevos." /></Panel>
          </div>
        </div>
      </div>
    </Page>
  );
}
