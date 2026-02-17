import { useEffect, useState } from "react";
import { getAllBots } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook para obtener la lista de bots disponibles
 * Se carga automáticamente cuando el usuario está autenticado
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
        const data = await getAllBots();
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

export default useBots;
