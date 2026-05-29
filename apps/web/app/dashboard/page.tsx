"use client";

import { useEffect, useState } from "react";
import { Zap, TrendingUp, HelpCircle, ChevronRight, Award } from "lucide-react";

type MetricGroup = {
  confidenceScore: number;
  fillerCount: number;
  starUsage: number;
  wordCount: number;
};

type SessionSummary = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
};

type SessionMetric = {
  id: string;
  title: string;
  startedAt: string;
  endedAt: string | null;
  status: string;
  metrics: MetricGroup;
  summary: SessionSummary | null;
};

type DashboardData = {
  global: {
    averageConfidence: number;
    averageFillers: number;
    sessionsCompleted: number;
    weeklyTrend: Array<{ week: string; count: number }>;
  };
  sessions: SessionMetric[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("http://localhost:4000/api/analytics/dashboard", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to load analytics dashboard.");
        }
        const resJson = await response.json();
        setData(resJson);
        if (resJson.sessions && resJson.sessions.length > 0) {
          setSelectedSessionId(resJson.sessions[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const selectedSession = data?.sessions.find((s) => s.id === selectedSessionId);

  // Math helper for bar charts
  const maxTrendCount = data?.global.weeklyTrend.reduce((max, t) => Math.max(max, t.count), 1) || 1;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#090D1A] text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm font-medium">Analyzing intelligence transcripts...</p>
        </div>
      </main>
    );
  }

  if (!data || data.sessions.length === 0) {
    return (
      <main className="min-h-screen bg-[#090D1A] text-zinc-100 flex items-center justify-center flex-col relative font-sans">
        <nav className="absolute top-0 w-full border-b border-white/[0.06] bg-neutral-950/20 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
              <Zap className="text-white w-4 h-4 fill-white/10" />
            </div>
            <span className="font-bold text-lg text-white">Ted Intelligence</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Interview</a>
            <a href="/history" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">History</a>
            <a href="/dashboard" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Dashboard</a>
          </div>
        </nav>
        <div className="text-center p-8 rounded-2xl bg-neutral-900/40 border border-white/5 backdrop-blur-xl max-w-sm mt-16">
          <p className="text-zinc-400 text-sm mb-4">No analytics data available. Complete an interview to view dashboard.</p>
          <a href="/" className="inline-block px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold transition-all text-sm">
            Start Ted Session
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090D1A] text-zinc-100 font-sans relative overflow-hidden pb-16">
      {/* Decorative glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-20 border-b border-white/[0.06] bg-neutral-950/20 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
            <Zap className="text-white w-4 h-4 fill-white/10" />
          </div>
          <span className="font-bold text-lg text-white">Ted Intelligence</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Interview</a>
          <a href="/history" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">History</a>
          <a href="/dashboard" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Dashboard</a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-12 relative z-10">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Performance Analytics Dashboard</h1>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="p-6 rounded-2xl bg-neutral-900/40 border border-white/[0.06] backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all hover:scale-[1.01]">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp className="w-24 h-24 text-indigo-400" />
            </div>
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Average Confidence</div>
            <div className="text-3xl font-extrabold text-white flex items-baseline gap-1">
              {data.global.averageConfidence}%
            </div>
            <div className="text-zinc-400 text-xs mt-2">Speech pace and certainty score</div>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/40 border border-white/[0.06] backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all hover:scale-[1.01]">
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Average Fillers</div>
            <div className="text-3xl font-extrabold text-white flex items-baseline gap-1">
              {data.global.averageFillers}
              <span className="text-xs font-semibold text-zinc-500">/ turn</span>
            </div>
            <div className="text-zinc-400 text-xs mt-2">Um, uh, basically, actually counts</div>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/40 border border-white/[0.06] backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all hover:scale-[1.01]">
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Completed Sessions</div>
            <div className="text-3xl font-extrabold text-white">
              {data.global.sessionsCompleted}
            </div>
            <div className="text-zinc-400 text-xs mt-2">Total interview records persisted</div>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/40 border border-white/[0.06] backdrop-blur-xl flex flex-col justify-between hover:border-indigo-500/30 transition-all hover:scale-[1.01] min-h-[140px]">
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Weekly Progress</div>
            <div className="flex items-end justify-between h-16 gap-2">
              {data.global.weeklyTrend.map((t, i) => {
                const heightPercent = Math.max(10, Math.round((t.count / maxTrendCount) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group/bar cursor-help">
                    <div className="w-full bg-indigo-500/20 hover:bg-indigo-500/50 rounded-md transition-all relative" style={{ height: `${heightPercent}%` }}>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-neutral-950 border border-white/10 text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                        {t.count} sessions
                      </div>
                    </div>
                    <span className="text-[9px] text-zinc-500 mt-2 font-mono">{t.week}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Session Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel: Session list */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-white mb-2">Sessions List</h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {data.sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSessionId(s.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                    s.id === selectedSessionId
                      ? "bg-indigo-500/10 border-indigo-500/50 shadow-md shadow-indigo-500/5"
                      : "bg-neutral-900/40 border-white/[0.06] hover:bg-neutral-900/80 hover:border-white/20"
                  }`}
                >
                  <div className="truncate pr-4">
                    <div className="font-semibold text-sm text-zinc-200 truncate group-hover:text-white transition-colors">
                      {s.title}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1">
                      {new Date(s.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                      s.status === "COMPLETED"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                    }`}>
                      {s.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right panel: Session Details */}
          <div className="lg:col-span-2">
            {selectedSession ? (
              <div className="rounded-2xl border border-white/[0.06] bg-neutral-900/40 backdrop-blur-xl p-6 shadow-2xl relative">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedSession.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      ID: <span className="font-mono text-zinc-400">{selectedSession.id}</span>
                    </p>
                  </div>
                  <a
                    href={`/history/${selectedSession.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold transition-all hover:scale-105"
                  >
                    Replay Conversation
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Session metrics cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 rounded-xl border border-white/5 bg-black/25">
                    <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Confidence</div>
                    <div className="text-2xl font-extrabold text-white">{selectedSession.metrics.confidenceScore}%</div>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-black/25">
                    <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Filler Count</div>
                    <div className="text-2xl font-extrabold text-white">{selectedSession.metrics.fillerCount}</div>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-black/25">
                    <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">STAR Format</div>
                    <div className="text-2xl font-extrabold text-white">{selectedSession.metrics.starUsage}%</div>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-black/25">
                    <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Word Count</div>
                    <div className="text-2xl font-extrabold text-white">{selectedSession.metrics.wordCount}</div>
                  </div>
                </div>

                {/* Session summary evaluate */}
                {selectedSession.summary ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                      <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-lg">
                        {selectedSession.summary.score}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-200 flex items-center gap-1.5">
                          Evaluation Score
                          <Award className="w-4 h-4 text-indigo-400" />
                        </h4>
                        <p className="text-xs text-zinc-400 mt-0.5">Overall answer clarity, technical correctness, and pacing index.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3">Key Strengths</h4>
                        <ul className="space-y-2">
                          {selectedSession.summary.strengths.map((str, index) => (
                            <li key={index} className="text-xs text-zinc-300 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                              {str}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">Weaknesses</h4>
                        <ul className="space-y-2">
                          {selectedSession.summary.weaknesses.map((weak, index) => (
                            <li key={index} className="text-xs text-zinc-300 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                              {weak}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Recommended Actions & STAR Analysis</h4>
                      <ul className="space-y-2.5">
                        {selectedSession.summary.recommendations.map((rec, index) => (
                          <li key={index} className="text-xs text-zinc-300 leading-relaxed flex items-start gap-2.5 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 rounded-xl border border-dashed border-white/10 bg-black/10">
                    <HelpCircle className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-zinc-300 text-sm">No Summary Evaluation Available</h4>
                    <p className="text-xs text-zinc-500 mt-1 px-8 max-w-sm mx-auto">
                      {selectedSession.status === "ACTIVE"
                        ? "Stop the interview to generate the overall feedback summary evaluation automatically."
                        : "No transcripts were recorded during this session to produce a summary."}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 rounded-2xl border border-dashed border-white/10 text-zinc-500 text-sm">
                Select a session from the list to view evaluation metrics.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
