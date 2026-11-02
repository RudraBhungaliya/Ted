"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getSession } from "../../../lib/api/session";
import { SessionMessage } from "../../../components/session-message";
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  MessageSquare,
} from "lucide-react";
import Loader from "../../../components/common/Loader";

type Transcript = {
  id: string;
  text: string;
  createdAt: string;
  speakerName?: string;
  speakerType?: string;
};

type AiMessage = {
  id: string;
  text: string;
  createdAt: string;
};

type Analytics = {
  id: string;
  totalWords: number;
  fillerCount: number;
  confidenceScore: number;
  usesStarFormat: boolean;
  technicalScore?: number;
  communicationScore?: number;
};

interface SessionData {
  id: string;
  mode?: string;
  startedAt?: string;
  transcripts?: Transcript[];
  aiMessages?: AiMessage[];
  timeline?: Array<{
    id: string;
    role: "user" | "interviewer" | "ai";
    speakerName?: string;
    text: string;
    createdAt?: string;
    timestamp?: number;
  }>;
  analytics?: Analytics | Analytics[];
  summary?: {
    score?: number;
    strengths?: string[];
    keyPoints?: string[];
    weaknesses?: string[];
    recommendations?: string[];
    actionItems?: string[];
  };
}

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{
    sessionId: string;
  }>;
}) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSession(sessionId);
        setSession(data);
      } catch (err) {
        console.error("Failed to load session:", err);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <Loader label="Loading session transcript..." size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-base font-semibold text-stone-800 mb-2">Session not found</p>
        <p className="text-xs text-stone-500 mb-6">The requested session record does not exist or was removed.</p>
        <Link
          href="/history"
          className="px-4 py-2 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition"
        >
          Return to History
        </Link>
      </div>
    );
  }

  const messages = (session.timeline ?? [
    ...(session.transcripts ?? []).map((transcript: Transcript) => ({
      id: transcript.id,
      role: (transcript.speakerType === "USER"
        ? "user"
        : transcript.speakerType === "PARTICIPANT"
          ? "interviewer"
          : "ai") as "user" | "interviewer" | "ai",
      speakerName:
        transcript.speakerName ||
        (transcript as { speaker?: string }).speaker ||
        (transcript.speakerType === "USER"
          ? "You"
          : transcript.speakerType === "AI"
            ? "TED Assistant"
            : "Interviewer"),
      text: transcript.text,
      createdAt: transcript.createdAt,
    })),
    ...(session.aiMessages ?? []).map((message: AiMessage) => ({
      id: message.id,
      role: "ai" as const,
      speakerName: "TED Assistant",
      text: message.text,
      createdAt: message.createdAt,
    })),
  ]).sort(
    (a: { createdAt?: string; timestamp?: number }, b: { createdAt?: string; timestamp?: number }) =>
      (a.timestamp ?? new Date(a.createdAt!).getTime()) -
      (b.timestamp ?? new Date(b.createdAt!).getTime()),
  );

  const latestAnalytics: Analytics | undefined = Array.isArray(session.analytics)
    ? session.analytics[0]
    : session.analytics;

  const rawSummary = session.summary;
  const summary = rawSummary
    ? {
        score:
          rawSummary.score ??
          latestAnalytics?.technicalScore ??
          latestAnalytics?.communicationScore ??
          0,
        strengths: rawSummary.strengths ?? rawSummary.keyPoints ?? [],
        weaknesses: rawSummary.weaknesses ?? [],
        recommendations:
          rawSummary.recommendations ?? rawSummary.actionItems ?? [],
      }
    : null;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-800 antialiased selection:bg-amber-100 selection:text-amber-900 pb-20">
      {/* Header */}
      <header className="border-b border-stone-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/history"
            className="inline-flex items-center gap-2 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-stone-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Archive
          </Link>
          <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
            <span>{session.mode || "SESSION"}</span>
            <span>·</span>
            <span>{session.startedAt ? new Date(session.startedAt).toLocaleDateString() : ""}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 pt-10">
        <div className="mb-8">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80 mb-2 inline-block">
            Transcript & Analysis
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900 tracking-tight">
            Session Replay
          </h1>
        </div>

        {/* Analytics & Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {latestAnalytics && (
            <div className="md:col-span-1 border border-stone-200/80 rounded-2xl p-6 bg-white shadow-xs">
              <h2 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-stone-500" />
                Pace & Metrics
              </h2>
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">Total Words</span>
                  <span className="font-semibold text-stone-900 font-mono">
                    {latestAnalytics.totalWords}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">Filler Words</span>
                  <span className="font-semibold text-stone-900 font-mono">
                    {latestAnalytics.fillerCount}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">Confidence Score</span>
                  <span className="font-semibold text-amber-700 font-mono">
                    {latestAnalytics.confidenceScore}%
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-stone-500">STAR Format</span>
                  <span
                    className={`font-semibold ${
                      latestAnalytics.usesStarFormat ? "text-emerald-700" : "text-stone-400"
                    }`}
                  >
                    {latestAnalytics.usesStarFormat ? "Applied" : "Not Detected"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {summary && (
            <div className="md:col-span-2 border border-stone-200/80 bg-white rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    Coach Summary
                  </h2>
                  {summary.score > 0 && (
                    <div className="text-sm font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-lg">
                      Score: {summary.score}/100
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {summary.strengths?.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Strengths
                      </div>
                      <ul className="space-y-1.5">
                        {summary.strengths.slice(0, 3).map((s: string, idx: number) => (
                          <li key={idx} className="text-xs text-stone-600 flex items-start gap-1.5 leading-relaxed">
                            <span className="text-emerald-500 font-bold shrink-0">·</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {summary.weaknesses?.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100">
                      <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Key Opportunities
                      </div>
                      <ul className="space-y-1.5">
                        {summary.weaknesses.slice(0, 3).map((w: string, idx: number) => (
                          <li key={idx} className="text-xs text-stone-600 flex items-start gap-1.5 leading-relaxed">
                            <span className="text-amber-500 font-bold shrink-0">·</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {summary.recommendations?.[0] && (
                <div className="pt-3 border-t border-stone-100">
                  <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                    Coach Recommendation
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed italic">
                    "{summary.recommendations[0]}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timeline Messages */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-4 h-4 text-stone-500" />
            <h2 className="text-sm font-semibold text-stone-800">
              Conversation Flow ({messages.length})
            </h2>
          </div>

          <div className="space-y-4">
            {messages.map((message: { id: string; role: "user" | "interviewer" | "ai"; speakerName?: string; text: string }) => (
              <SessionMessage
                key={message.id}
                role={message.role}
                speakerName={message.speakerName}
                text={message.text}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
