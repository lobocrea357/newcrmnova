import { useEffect, useState } from "react";
import { getBotsForUser, getOtherBots } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";

/**
 * Hook para obtener la lista de bots del dashboard principal.
 * - Supervisor: solo bots _other.
 * - Lider: bots según su bot_session_suffix.
 * - Admin/Super Admin: todos los bots excepto _other.
 * - Otros: bots excepto _other.
 */
export function useBots() {
  const { user, isAuthenticated } = useAuth();
  const { profile, isSuperAdmin, isAdmin, isSupervisor, isLider } = useUserProfile();
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
        console.log('DEBUG useBots:', { isSuperAdmin, isAdmin, isSupervisor, isLider, suffix, profileId: profile?.id, email: profile?.email });

        let data;
        if (isSupervisor) {
          data = await getOtherBots();
        } else if (suffix) {
          data = await getBotsForUser(suffix);
        } else {
          data = await getBotsForUser(null);
        }

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
  }, [user, isAuthenticated, profile, isSuperAdmin, isAdmin, isSupervisor, isLider]);

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
