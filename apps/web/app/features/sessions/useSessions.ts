import { useEffect, useState } from "react";

import { getSessions, getSessionDetails } from "./api";

export function useSessions() {
  const [sessions, setSessions] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setLoading(true);

      const data = await getSessions();

      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return {
    sessions,
    loading,
    error,
    refresh,
  };
}

export function useSessionDetails(sessionId: string) {
  const [session, setSession] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const data = await getSessionDetails(sessionId);

        setSession(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      void load();
    }
  }, [sessionId]);

  return {
    session,
    loading,
    error,
  };
}
