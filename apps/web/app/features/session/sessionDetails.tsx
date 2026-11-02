"use client";

import Link from "next/link";
import { useSessionDetails } from "./useSessions";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import Loader from "../../components/common/Loader";

interface Props {
  sessionId: string;
}

interface TimelineItem {
  id: string;
  role: "user" | "interviewer" | "ai";
  speakerName: string;
  text: string;
  timestamp: number;
}

export function SessionDetails({ sessionId }: Props) {
  const { session, loading } = useSessionDetails(sessionId);

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-stone-200/80 shadow-xs">
        <Loader label="Loading session details..." />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-stone-200/80 shadow-xs">
        <p className="text-sm font-medium text-stone-700 mb-1">Session Not Found</p>
        <p className="text-xs text-stone-400">
          The requested session could not be retrieved.
        </p>
      </div>
    );
  }

  const timeline: TimelineItem[] = session.timeline ?? [
    ...(session.transcripts ?? []).map((t: { id: string; speakerType?: string; speakerName?: string; text: string; createdAt: string }) => ({
      id: t.id,
      role:
        t.speakerType === "USER"
          ? ("user" as const)
          : t.speakerType === "PARTICIPANT"
            ? ("interviewer" as const)
            : ("ai" as const),
      speakerName:
        t.speakerName ||
        (t.speakerType === "USER"
          ? "You"
          : t.speakerType === "AI"
            ? "TED Companion"
            : "Participant"),
      text: t.text,
      timestamp: new Date(t.createdAt).getTime(),
    })),
    ...(session.aiMessages ?? []).map((m: { id: string; text: string; createdAt: string }) => ({
      id: m.id,
      role: "ai" as const,
      speakerName: "TED Companion",
      text: m.text,
      timestamp: new Date(m.createdAt).getTime(),
    })),
  ].sort((a: TimelineItem, b: TimelineItem) => a.timestamp - b.timestamp);

  const analytics = Array.isArray(session.analytics)
    ? session.analytics[0]
    : session.analytics;

  const summary = session.summary
    ? {
        score:
          session.summary.score ??
          analytics?.technicalScore ??
          analytics?.communicationScore ??
          0,
        strengths: session.summary.strengths ?? session.summary.keyPoints ?? [],
        weaknesses: session.summary.weaknesses ?? [],
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Session Top Card */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              {session.mode || "SESSION"}
            </span>
            <span className="text-stone-300">·</span>
            <span className="text-xs text-stone-400 font-mono">
              ID: {sessionId.slice(0, 8)}...
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Recorded {session.startedAt ? new Date(session.startedAt).toLocaleString() : "Recently"}
          </p>
        </div>

        <Link
          href={`/session/${sessionId}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-medium transition-colors"
        >
          <span>Open Full View</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-xs">
            <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block mb-1">
              Confidence
            </span>
            <span className="text-xl font-serif font-bold text-stone-800">
              {analytics.confidenceScore ?? 85}%
            </span>
          </div>
          <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-xs">
            <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block mb-1">
              Words Spoken
            </span>
            <span className="text-xl font-serif font-bold text-stone-800">
              {analytics.totalWords ?? 0}
            </span>
          </div>
          <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-xs">
            <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block mb-1">
              Filler Words
            </span>
            <span className="text-xl font-serif font-bold text-stone-800">
              {analytics.fillerCount ?? 0}
            </span>
          </div>
          <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-xs">
            <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block mb-1">
              STAR Structure
            </span>
            <span className={`text-xl font-serif font-bold ${analytics.usesStarFormat ? "text-emerald-700" : "text-stone-400"}`}>
              {analytics.usesStarFormat ? "Applied" : "Standard"}
            </span>
          </div>
        </div>
      )}

      {/* Structured Coaching Summary */}
      {summary && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-stone-800">
                Coaching Evaluation
              </h3>
            </div>
            {summary.score > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">
                Score: {summary.score}/100
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {summary.strengths?.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 mb-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Key Strengths
                </span>
                <ul className="space-y-1.5">
                  {summary.strengths.map((item: string, idx: number) => (
                    <li key={idx} className="text-xs text-stone-600 leading-relaxed flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold shrink-0">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.weaknesses?.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 mb-2.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Areas to Polish
                </span>
                <ul className="space-y-1.5">
                  {summary.weaknesses.map((item: string, idx: number) => (
                    <li key={idx} className="text-xs text-stone-600 leading-relaxed flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold shrink-0">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transcript Log */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-stone-500" />
          <h3 className="text-sm font-semibold text-stone-800">
            Recorded Conversation ({timeline.length})
          </h3>
        </div>

        {timeline.length === 0 ? (
          <p className="text-xs text-stone-400 py-6 text-center">
            No spoken exchanges were captured during this session.
          </p>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
            {timeline.map((item: TimelineItem) => {
              const isUser = item.role === "user";
              const isAI = item.role === "ai";

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    isAI
                      ? "bg-amber-50/60 border-amber-200/70 text-amber-950"
                      : isUser
                        ? "bg-stone-50 border-stone-200/80 text-stone-800"
                        : "bg-blue-50/60 border-blue-200/70 text-blue-950"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[11px] text-stone-700">
                      {item.speakerName || (isUser ? "You" : isAI ? "TED Companion" : "Interviewer")}
                    </span>
                    {item.timestamp && (
                      <span className="text-[10px] text-stone-400 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <p>{item.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
