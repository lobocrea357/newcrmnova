import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAIAuditor() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchInitialData() {
      // Traemos las evaluaciones del día de hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('conversation_evaluations')
        .select(`
          *,
          bot:bot_id (id, session_name),
          chat:chat_id (id, contact_name)
        `)
        .gte('evaluation_date', today.toISOString())
        .order('evaluation_date', { ascending: false });

      if (error) {
        console.error('Error fetching AI evaluations:', error);
      } else if (mounted) {
        setEvaluations(data || []);
      }
      if (mounted) setLoading(false);
    }

    fetchInitialData();

    // Suscribirse a nuevos análisis de la IA
    const channel = supabase
      .channel('realtime_ai_auditor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_evaluations',
        },
        async (payload) => {
          // Cuando llega uno nuevo, consultamos los detalles del bot y el chat para completar la información
          const { data: enrichedData, error } = await supabase
            .from('conversation_evaluations')
            .select(`
              *,
              bot:bot_id (id, session_name),
              chat:chat_id (id, contact_name)
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && enrichedData) {
            setEvaluations((prev) => [enrichedData, ...prev]);
          } else {
            setEvaluations((prev) => [payload.new, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { evaluations, loading };
}
