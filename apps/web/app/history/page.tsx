"use client";

import { useEffect, useState } from "react";
import { getAllSessions } from "../lib/api/session";
import { SessionCard } from "../components/session-card";
import { Zap } from "lucide-react";

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

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:4000/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="min-h-screen bg-[#090D1A] text-zinc-100 font-sans relative overflow-hidden pb-16">
      {/* Decorative glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Premium Navbar */}
      <nav className="relative z-20 border-b border-white/[0.06] bg-neutral-950/20 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
            <Zap className="text-white w-4 h-4 fill-white/10" />
          </div>
          <span className="font-bold text-lg text-white">Ted Intelligence</span>
        </div>
        <div className="flex items-center gap-6 font-medium">
          <a href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">Interview</a>
          <a href="/history" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">History</a>
          <a href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">Dashboard</a>
          <button onClick={handleLogout} className="text-sm text-zinc-400 hover:text-red-400 transition-colors cursor-pointer">
            Logout
          </button>
        </div>
      </nav>

      <div className="p-8 max-w-5xl mx-auto relative z-10">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Interview History</h1>

        {loading ? (
          <div className="text-center py-12 text-zinc-400">Loading history...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">No sessions recorded yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
