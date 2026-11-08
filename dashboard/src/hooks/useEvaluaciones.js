'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchEvaluaciones } from '@/lib/inteligencia';

/**
 * Evaluaciones IA del periodo, con recarga automática cuando la auditoría
 * guarda o actualiza una (realtime sobre conversation_evaluations).
 */
export function useEvaluaciones(periodId) {
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchEvaluaciones(periodId);
      setEvals(data);
      setUpdatedAt(new Date());
    } catch (e) {
      setError(e?.message || 'No se pudieron cargar las evaluaciones');
    } finally {
      setLoading(false);
    }
  }, [periodId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`ia-evaluaciones-${periodId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_evaluations' }, () => {
        clearTimeout(timer.current);
        timer.current = setTimeout(load, 1500); // agrupa ráfagas de la auditoría
      })
      .subscribe();
    return () => {
      clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [periodId, load]);

  return { evals, loading, error, updatedAt, reload: load };
}
