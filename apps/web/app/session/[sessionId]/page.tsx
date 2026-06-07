"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Layers,
  ShieldAlert,
  Sparkles,
  User,
  Users,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
  "http://localhost:4000";

type TimelineItem = {
  id: string;
  role: "user" | "interviewer" | "ai";
  speakerName: string;
  text: string;
  timestamp: number;
};

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch(`${API_URL}/api/session/${sessionId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load session");
        }

        const data = await response.json();
        setSession(data.session);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#090D1A] text-zinc-400 flex items-center justify-center font-medium">
        Loading session configurations...
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-[#090D1A] text-white flex flex-col gap-4 items-center justify-center">
        <div className="flex items-center gap-2 text-red-400">
          <ShieldAlert className="w-5 h-5" />
          <span className="font-semibold">Session not found</span>
        </div>
        <button
          onClick={() => router.push("/history")}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to History
        </button>
      </main>
    );
  }

  const isMeetingMode = session.mode === "MEETING";

  return (
    <main className="min-h-screen bg-[#090D1A] text-zinc-100 p-8 select-none">
      <div className="max-w-4xl mx-auto">
        {/* Top Header Navigation Panel */}
        <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-8">
          <div>
            <button
              onClick={() => router.push("/history")}
              className="group mb-3 flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to History
            </button>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              {session.title || "TED Session"}{" "}
              <span className="text-zinc-600 font-mono text-xl font-normal ml-1">
                #{session.id.substring(0, 8)}
              </span>
            </h1>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold border uppercase tracking-wider ${
              session.status === "COMPLETED"
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-blue-500/10 border-blue-500/20 text-blue-400"
            }`}
          >
            {session.status}
          </span>
        </div>

        {/* Dynamic Metadata Feature Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">
              {isMeetingMode ? (
                <Users className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
              )}
              Mode
            </div>
            <p className="text-sm font-bold text-zinc-200">{session.mode}</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5 text-purple-400" /> Date
            </div>
            <p className="text-sm font-bold text-zinc-200">
              {format(new Date(session.startedAt), "MMM d, yyyy")}
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> Started At
            </div>
            <p className="text-sm font-bold text-zinc-200">
              {format(new Date(session.startedAt), "h:mm a")}
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Duration
            </div>
            <p className="text-sm font-bold text-zinc-200">
              {session.durationSeconds
                ? `${Math.floor(session.durationSeconds / 60)
                    .toString()
                    .padStart(
                      2,
                      "0",
                    )}:${(session.durationSeconds % 60).toString().padStart(2, "0")}`
                : "Running"}
            </p>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 mb-8">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">
            Performance Analytics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-zinc-500 text-xs uppercase tracking-wide">
                Total Words
              </div>
              <div className="text-2xl font-black text-zinc-200 mt-1">
                {session.analytics?.totalWords ?? 0}
              </div>
            </div>
            <div>
              <div className="text-zinc-500 text-xs uppercase tracking-wide">
                Filler Count
              </div>
              <div className="text-2xl font-black text-zinc-200 mt-1">
                {session.analytics?.fillerCount ?? 0}
              </div>
            </div>
            <div>
              <div className="text-zinc-500 text-xs uppercase tracking-wide">
                Confidence Score
              </div>
              <div className="text-2xl font-black text-indigo-400 mt-1">
                {session.analytics?.confidenceScore ?? 0}%
              </div>
            </div>
            <div>
              <div className="text-zinc-500 text-xs uppercase tracking-wide">
                Communication
              </div>
              <div className="text-2xl font-black text-purple-400 mt-1">
                {session.analytics?.communicationScore ?? 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Summary Details Section Block */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 mb-8">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">
            AI Summary Context
          </h2>
          {session.summary ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-300 leading-relaxed">
                {session.summary.overview}
              </p>

              {session.summary.keyPoints?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase mb-2">
                    Key Highlights
                  </h4>
                  <ul className="list-disc pl-5 text-sm text-zinc-400 space-y-1">
                    {session.summary.keyPoints.map(
                      (point: string, idx: number) => (
                        <li key={idx}>{point}</li>
                      ),
                    )}
                  </ul>
                </div>
              )}

              {session.summary.actionItems?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase mb-2">
                    Action Items
                  </h4>
                  <ul className="list-disc pl-5 text-sm text-zinc-400 space-y-1">
                    {session.summary.actionItems.map(
                      (item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">
              No structured data summaries computed for this session execution.
            </p>
          )}
        </div>

        {/* New Unified Conversations Interleaved Chronological Matrix Feed Container */}
        <div className="rounded-2xl border border-white/5 bg-neutral-900/10 p-6 backdrop-blur-md">
          <div className="mb-6">
            <h3 className="text-sm font-bold tracking-wide text-zinc-100 uppercase">
              Conversation Timeline
            </h3>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Unified real-time flowchart mapping dialog context step-by-step.
            </p>
          </div>

          <div className="relative ml-3 border-l border-zinc-800/80 pl-6 space-y-6 py-2">
            {session.timeline?.map((item: TimelineItem) => {
              const isUser = item.role === "user";
              const isAi = item.role === "ai";

              return (
                <div key={item.id} className="relative group">
                  {/* Color Coded Timeline Anchor Circle */}
                  <div
                    className={`absolute -left-[29px] top-1.5 h-2 w-2 rounded-full border bg-neutral-950 transition-all duration-300 ${
                      isAi
                        ? "border-indigo-500 ring-4 ring-indigo-500/15"
                        : isUser
                          ? "border-emerald-500 ring-4 ring-emerald-500/10"
                          : "border-purple-500 ring-4 ring-purple-500/10"
                    }`}
                  />

                  {/* Message Card Body Layout Element */}
                  <div
                    className={`rounded-xl border p-4 transition-colors duration-200 ${
                      isAi
                        ? "bg-indigo-500/[0.03] border-indigo-500/15 hover:border-indigo-500/25"
                        : isUser
                          ? "bg-emerald-500/[0.02] border-emerald-500/10 hover:border-emerald-500/20"
                          : "bg-neutral-900/40 border-white/5 hover:border-white/10"
                    }`}
                  >
                    {/* Speaker Header Meta Info Layout Container */}
                    <div className="flex items-center justify-between mb-1.5 select-none">
                      <span
                        className={`text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 ${
                          isAi
                            ? "text-indigo-400"
                            : isUser
                              ? "text-emerald-400"
                              : "text-purple-400"
                        }`}
                      >
                        {isAi && (
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                        {isUser && (
                          <User className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        {item.speakerName}
                        <span className="text-[9px] text-zinc-500 font-normal normal-case opacity-80 ml-1">
                          •{" "}
                          {item.role === "user"
                            ? "You (Microphone)"
                            : item.role === "ai"
                              ? "Suggested Answer"
                              : "Meeting Stream"}
                        </span>
                      </span>

                      <span className="font-mono text-[10px] tracking-tight text-zinc-500">
                        {format(new Date(item.timestamp), "hh:mm:ss a")}
                      </span>
                    </div>

                    {/* Content Transcription Box Paragraph Element */}
                    <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap select-text selection:bg-indigo-500/20 font-medium">
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}

            {(!session.timeline || session.timeline.length === 0) && (
              <div className="rounded-xl border border-dashed border-white/5 p-8 text-center">
                <p className="text-xs text-zinc-500 italic">
                  No tracking sequences or conversation strings compiled inside
                  the target workspace.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
