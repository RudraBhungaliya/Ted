"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  HelpCircle,
  ChevronRight,
  Award,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Calendar,
} from "lucide-react";
import Navbar from "../components/common/Navbar";

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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
  "http://localhost:4000";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`${API_URL}/api/analytics/dashboard`, {
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

  const selectedSession = data?.sessions.find(
    (s) => s.id === selectedSessionId,
  );

  const maxTrendCount =
    data?.global.weeklyTrend.reduce((max, t) => Math.max(max, t.count), 1) || 1;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] text-stone-900 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-sm font-medium">
            Gathering session metrics...
          </p>
        </div>
      </main>
    );
  }

  if (!data || data.sessions.length === 0) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans">
        <Navbar />
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <div className="bg-white p-8 rounded-3xl border border-stone-200/90 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-500">
              <TrendingUp className="w-6 h-6 text-stone-600" />
            </div>
            <h2 className="text-lg font-bold text-stone-900">
              No analytics yet
            </h2>
            <p className="text-stone-500 text-xs mt-1.5 leading-relaxed mb-6">
              Complete your first interview practice or meeting recording to generate your speaking metrics and review recommendations.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors shadow-xs"
            >
              Start a Session
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans selection:bg-amber-200 pb-16">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 pt-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            Conversation Insights
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Speaking confidence, verbal fluency, and structured coaching takeaways.
          </p>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Metric 1 */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-stone-600 text-[11px] font-semibold uppercase tracking-wider">
                  Speaking Confidence
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-3xl font-bold text-stone-900">
                {data.global.averageConfidence}%
              </div>
            </div>
            <div className="text-stone-500 text-xs mt-3 pt-3 border-t border-stone-100">
              Calculated from pacing & certainty
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-stone-600 text-[11px] font-semibold uppercase tracking-wider">
                  Filler Words
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="text-3xl font-bold text-stone-900">
                {data.global.averageFillers}
                <span className="text-xs font-normal text-stone-600 ml-1">
                  / turn
                </span>
              </div>
            </div>
            <div className="text-stone-500 text-xs mt-3 pt-3 border-t border-stone-100">
              Um, uh, basically, like frequency
            </div>
          </div>

          {/* Metric 3 */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-stone-600 text-[11px] font-semibold uppercase tracking-wider">
                  Sessions Logged
                </span>
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <div className="text-3xl font-bold text-stone-900">
                {data.global.sessionsCompleted}
              </div>
            </div>
            <div className="text-stone-500 text-xs mt-3 pt-3 border-t border-stone-100">
              Total archived conversations
            </div>
          </div>

          {/* Metric 4 - Weekly Progress Bars */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex flex-col justify-between">
            <div className="text-stone-600 text-[11px] font-semibold uppercase tracking-wider mb-2">
              Weekly Activity
            </div>
            <div className="flex items-end justify-between h-14 gap-2 pt-1">
              {data.global.weeklyTrend.map((t, i) => {
                const heightPercent = Math.max(
                  15,
                  Math.round((t.count / maxTrendCount) * 100),
                );
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center group relative cursor-help"
                  >
                    <div
                      className="w-full bg-stone-200 group-hover:bg-stone-800 rounded-md transition-colors"
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-stone-900 text-white text-[10px] px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-30 shadow-xs">
                        {t.count} sessions
                      </div>
                    </div>
                    <span className="text-[10px] text-stone-600 mt-1.5 font-medium">
                      {t.week}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Master Detail Session Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Session List */}
          <div className="lg:col-span-1 bg-white rounded-3xl p-5 border border-stone-200/90 shadow-xs">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3 px-1">
              Select Session
            </h2>
            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {data.sessions.map((s) => {
                const isSelected = s.id === selectedSessionId;
                const isCompleted = s.status === "COMPLETED";

                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSessionId(s.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                        : "bg-white border-stone-200/80 hover:bg-stone-50 hover:border-stone-300"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div
                        className={`font-semibold text-xs truncate ${
                          isSelected ? "text-white" : "text-stone-900"
                        }`}
                      >
                        {s.title}
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          isSelected ? "text-stone-300" : "text-stone-600"
                        }`}
                      >
                        {new Date(s.startedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                          isSelected
                            ? "bg-stone-800 text-stone-200 border-stone-700"
                            : isCompleted
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {isCompleted ? "Saved" : "Active"}
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 ${
                          isSelected ? "text-stone-300" : "text-stone-400 group-hover:text-stone-600"
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Detailed Session Breakdown */}
          <div className="lg:col-span-2">
            {selectedSession ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-stone-100 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">
                      {selectedSession.title}
                    </h3>
                    <p className="text-xs text-stone-600 font-mono mt-0.5">
                      Session ID: {selectedSession.id}
                    </p>
                  </div>
                  <Link
                    href={`/session/${selectedSession.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors self-start sm:self-auto"
                  >
                    <span>Read Full Transcript</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
                    <span className="text-stone-600 text-[10px] uppercase font-semibold block mb-1">
                      Confidence
                    </span>
                    <span className="text-xl font-bold text-stone-900">
                      {selectedSession.metrics.confidenceScore}%
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
                    <span className="text-stone-600 text-[10px] uppercase font-semibold block mb-1">
                      Filler Count
                    </span>
                    <span className="text-xl font-bold text-stone-900">
                      {selectedSession.metrics.fillerCount}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
                    <span className="text-stone-600 text-[10px] uppercase font-semibold block mb-1">
                      STAR Method
                    </span>
                    <span className="text-xl font-bold text-stone-900">
                      {selectedSession.metrics.starUsage}%
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
                    <span className="text-stone-600 text-[10px] uppercase font-semibold block mb-1">
                      Total Words
                    </span>
                    <span className="text-xl font-bold text-stone-900">
                      {selectedSession.metrics.wordCount}
                    </span>
                  </div>
                </div>

                {/* Summary Evaluation */}
                {selectedSession.summary ? (
                  <div className="space-y-6">
                    {/* Score Banner */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                      <div className="w-12 h-12 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                        {selectedSession.summary.score}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                          Speaking Quality Score
                          <Award className="w-4 h-4 text-amber-700" />
                        </h4>
                        <p className="text-xs text-stone-600 mt-0.5">
                          Synthesized across technical clarity, directness, and conversational pacing.
                        </p>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70">
                        <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Key Strengths
                        </h4>
                        <ul className="space-y-2">
                          {selectedSession.summary.strengths.map((str, index) => (
                            <li
                              key={index}
                              className="text-xs text-stone-700 leading-relaxed flex items-start gap-2"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/70">
                        <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          Areas to Refine
                        </h4>
                        <ul className="space-y-2">
                          {selectedSession.summary.weaknesses.map((weak, index) => (
                            <li
                              key={index}
                              className="text-xs text-stone-700 leading-relaxed flex items-start gap-2"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                              <span>{weak}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                      <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                        Coaching & Next Steps
                      </h4>
                      <ul className="space-y-2">
                        {selectedSession.summary.recommendations.map((rec, index) => (
                          <li
                            key={index}
                            className="text-xs text-stone-700 leading-relaxed flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-500 mt-1.5 shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 rounded-2xl border border-dashed border-stone-200 bg-stone-50/50">
                    <HelpCircle className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-stone-800 text-sm">
                      No summary available yet
                    </h4>
                    <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                      Summary evaluations generate automatically once audio turns are finalized.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 rounded-3xl border border-dashed border-stone-200 bg-white text-stone-400 text-xs text-center">
                Select a session from the list to view performance metrics.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
