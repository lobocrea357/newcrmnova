import { useEffect, useState } from "react";
import { getMainBots, getOtherBots } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook para obtener la lista de bots del dashboard principal
 * Excluye automáticamente las sesiones con sufijo _other
 */
export function useBots() {
  const { user, isAuthenticated } = useAuth();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setBots([]);
      setLoading(false);
      setError(null);
      return;
    }

    const loadBots = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMainBots();
        setBots(data);
      } catch (err) {
        console.error('Error loading bots:', err);
        setError(err);
        setBots([]);
      } finally {
        setLoading(false);
      }
    };

    loadBots();
  }, [user, isAuthenticated]);

  return { bots, loading, error };
}

/**
 * Hook para obtener la lista de bots del dashboard "other"
 * Incluye solo las sesiones con sufijo _other
 */
export function useOtherBots() {
  const { user, isAuthenticated } = useAuth();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setBots([]);
      setLoading(false);
      setError(null);
      return;
    }

    const loadBots = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getOtherBots();
        setBots(data);
      } catch (err) {
        console.error('Error loading other bots:', err);
        setError(err);
        setBots([]);
      } finally {
        setLoading(false);
      }
    };

    loadBots();
  }, [user, isAuthenticated]);

  return { bots, loading, error };
}

export default useBots;
