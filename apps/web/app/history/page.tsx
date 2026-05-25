"use client";

import { useEffect, useState } from "react";

import { getAllSessions } from "../lib/api/session";

import { SessionCard } from "../components/session-card";

type Session = {
  id: string;

  startedAt: string;

  endedAt: string | null;
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAllSessions();

        setSessions(data.sessions ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1
        className="
          text-4xl
          font-bold
          mb-8
        "
      >
        Interview History
      </h1>

      {loading && <div>Loading...</div>}

      <div className="space-y-4">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
}
