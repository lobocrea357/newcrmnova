import { useEffect, useState } from "react";
import { getAllBots } from "@/lib/supabase";

export function useBots(user) {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const loadBots = async () => {
      try {
        setLoading(true);
        const data = await getAllBots();
        setBots(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadBots();
  }, [user]);

  return { bots, loading, error };
}
