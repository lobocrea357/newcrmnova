import { useEffect, useState } from "react";
import { getBotsForUser, getOtherBots } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";

/**
 * Hook para obtener la lista de bots del dashboard principal.
 * Filtra por sufijo de sesión asignado al usuario (bot_session_suffix).
 * Si el usuario no tiene sufijo, excluye solo las sesiones _other.
 */
export function useBots() {
  const { user, isAuthenticated } = useAuth();
  const { profile, isSuperAdmin, isAdmin, isLider } = useUserProfile();
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
        const suffix = isSuperAdmin || isAdmin || !isLider ? null : profile?.bot_session_suffix || null;
        const data = await getBotsForUser(suffix);
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
  }, [user, isAuthenticated, profile, isSuperAdmin, isAdmin, isLider]);

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
