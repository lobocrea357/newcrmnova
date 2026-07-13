import { useEffect, useState } from "react";
import { getBotsForUser, getOtherBots } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";

/**
 * Hook para obtener la lista de bots del dashboard principal.
 * Si el usuario tiene bot_session_suffix, muestra solo bots con ese sufijo.
 * Si no tiene sufijo, muestra todos los bots excepto los _other.
 */
export function useBots() {
  const { user, isAuthenticated } = useAuth();
  const { profile } = useUserProfile();
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
        const suffix = profile?.bot_session_suffix || null;
        console.log('DEBUG useBots:', { suffix, profileId: profile?.id, email: profile?.email });
        const data = await getBotsForUser(suffix);
        console.log('DEBUG useBots result:', { total: data.length, sessions: data.map(b => b.session_name) });
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
  }, [user, isAuthenticated, profile]);

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
