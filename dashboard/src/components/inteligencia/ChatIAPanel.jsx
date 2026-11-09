'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sparkles, X, RefreshCw } from 'lucide-react';
import { EmptyState, Skeleton, Button, cx } from '@/components/ui/kit';
import { EvaluationCard, PctBadge } from '@/components/inteligencia/parts';
import { fetchEvaluacionDeChat } from '@/lib/inteligencia';

/**
 * Evaluación IA dentro de una conversación: botón flotante + panel lateral.
 * Muestra la última evaluación de la auditoría continua y permite pedir una nueva.
 */
export default function ChatIAPanel({ chatId }) {
  const [open, setOpen] = useState(false);
  const [ev, setEv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!chatId) return;
    try {
      setEv(await fetchEvaluacionDeChat(chatId));
    } catch {
      setEv(null);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const evaluar = async () => {
    setEvaluating(true);
    setError(null);
    try {
      const r = await fetch('/api/inteligencia/evaluar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'No se pudo evaluar la conversación');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute right-4 top-[72px] z-20 inline-flex items-center gap-2 rounded-full border border-linea bg-white py-1.5 pl-3 pr-2 text-sm font-medium text-tinta shadow-md hover:border-nova-300"
        aria-haspopup="dialog"
      >
        <Sparkles className="h-4 w-4 text-nova-600" />
        <span className="hidden sm:inline">Evaluación IA</span>
        {!loading && ev && ev.estado !== 'no_aplica' && <PctBadge value={ev.percentage} />}
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Evaluación IA de la conversación">
          <div className="absolute inset-0 bg-tinta/30" onClick={() => setOpen(false)} />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-linea px-5 py-4">
              <div>
                <p className="text-[15px] font-semibold text-tinta">Evaluación IA</p>
                <p className="text-xs text-gray-500">La auditoría la actualiza sola cuando el chat se queda quieto 45 min</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Cerrar">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-40" />
                </div>
              ) : ev ? (
                <EvaluationCard ev={ev} showChatLink={false} compact />
              ) : (
                <EmptyState
                  icon={Sparkles}
                  title="Esta conversación aún no tiene evaluación"
                  description="Pide una ahora o espera a que la auditoría la revise."
                />
              )}
              {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            </div>

            <div className="border-t border-linea px-5 py-3">
              <Button variant="primary" className="w-full" onClick={evaluar} disabled={evaluating}>
                <RefreshCw className={cx('h-4 w-4', evaluating && 'animate-spin')} />
                {evaluating ? 'Evaluando…' : ev ? 'Volver a evaluar ahora' : 'Evaluar ahora'}
              </Button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
