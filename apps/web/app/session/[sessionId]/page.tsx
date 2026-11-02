"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  ListTodo,
  Copy,
  Check,
} from "lucide-react";
import Navbar from "../../components/common/Navbar";

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

interface SessionData {
  id: string;
  title?: string;
  mode?: "INTERVIEW" | "MEETING";
  status?: string;
  durationSeconds?: number;
  startedAt?: string;
  endedAt?: string;
  transcripts?: Array<{
    id: string;
    text: string;
    createdAt?: string;
    speakerType?: string;
    speakerName?: string;
    speaker?: string;
  }>;
  aiMessages?: Array<{
    id: string;
    text: string;
    createdAt?: string;
  }>;
  timeline?: TimelineItem[];
  summary?: {
    overview?: string;
    score?: number;
    strengths?: string[];
    keyPoints?: string[];
    weaknesses?: string[];
    recommendations?: string[];
    actionItems?: string[];
  };
  analytics?: {
    confidenceScore?: number;
    fillerCount?: number;
    totalWords?: number;
    usesStarFormat?: boolean;
    technicalScore?: number;
    communicationScore?: number;
  };
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  const handleCopyTranscript = () => {
    if (!session?.timeline) return;
    const fullText = session.timeline
      .map((item: TimelineItem) => `[${item.speakerName}]: ${item.text}`)
      .join("\n\n");
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] text-stone-900 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-sm font-medium">
            Loading transcript & notes...
          </p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans">
        <Navbar />
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <div className="bg-white p-8 rounded-3xl border border-stone-200/90 shadow-sm">
            <h2 className="text-lg font-bold text-stone-900 mb-2">
              Session Not Found
            </h2>
            <p className="text-stone-500 text-xs mb-6 leading-relaxed">
              We couldn&apos;t locate the session transcript. It may have been deleted or moved.
            </p>
            <button
              onClick={() => router.push("/history")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white font-medium text-xs hover:bg-stone-800 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to History</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  const isMeetingMode = session.mode === "MEETING";
  const durationText = session.durationSeconds
    ? `${Math.floor(session.durationSeconds / 60)}m ${session.durationSeconds % 60}s`
    : "In progress";

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans selection:bg-amber-200 pb-20">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 pt-8">
        {/* Breadcrumb Back */}
        <button
          onClick={() => router.push("/history")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors mb-6 cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Sessions
        </button>

        {/* Session Card Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-stone-100 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    isMeetingMode
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-orange-50 text-orange-800 border-orange-200"
                  }`}
                >
                  {isMeetingMode ? "Meeting" : "Interview"}
                </span>

                <span
                  className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${
                    session.status === "COMPLETED"
                      ? "bg-stone-100 text-stone-700 border-stone-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {session.status === "COMPLETED" ? "Archived" : "Active"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                {session.title || (isMeetingMode ? "Meeting Discussion" : "Interview Session")}
              </h1>
              <p className="text-xs text-stone-400 font-mono mt-1">
                Session ID: {session.id}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleCopyTranscript}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors shadow-2xs cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-400" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70">
              <span className="text-stone-400 text-[10px] uppercase font-semibold block mb-0.5">
                Date
              </span>
              <span className="font-semibold text-stone-800">
                {session.startedAt ? format(new Date(session.startedAt), "MMM d, yyyy") : "Recent"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70">
              <span className="text-stone-400 text-[10px] uppercase font-semibold block mb-0.5">
                Duration
              </span>
              <span className="font-semibold text-stone-800">{durationText}</span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70">
              <span className="text-stone-400 text-[10px] uppercase font-semibold block mb-0.5">
                Words Logged
              </span>
              <span className="font-semibold text-stone-800">
                {session.analytics?.totalWords ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70">
              <span className="text-stone-400 text-[10px] uppercase font-semibold block mb-0.5">
                Confidence
              </span>
              <span className="font-semibold text-stone-800">
                {session.analytics?.confidenceScore
                  ? `${session.analytics.confidenceScore}%`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Structured Summary Card (if available) */}
        {session.summary && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs mb-8">
            <h2 className="text-base font-bold text-stone-900 tracking-tight mb-3">
              Summary & Takeaways
            </h2>
            {session.summary.overview && (
              <p className="text-sm text-stone-700 leading-relaxed mb-6">
                {session.summary.overview}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-100">
              {(session.summary.keyPoints?.length ?? 0) > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Key Highlights
                  </h3>
                  <ul className="space-y-2 text-xs text-stone-600 leading-relaxed">
                    {session.summary.keyPoints!.map((point: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-1.5 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(session.summary.actionItems?.length ?? 0) > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <ListTodo className="w-3.5 h-3.5 text-blue-600" />
                    Action Items
                  </h3>
                  <ul className="space-y-2 text-xs text-stone-600 leading-relaxed">
                    {session.summary.actionItems!.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dialogue Stream Timeline */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs">
          <div className="mb-6 pb-4 border-b border-stone-100">
            <h2 className="text-base font-bold text-stone-900 tracking-tight">
              Conversation Transcript
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Chronological turns recorded during the live audio stream.
            </p>
          </div>

          <div className="space-y-4">
            {session.timeline?.map((item: TimelineItem) => {
              const isUser = item.role === "user";
              const isAssistant = item.role === "ai";

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isAssistant
                      ? "bg-amber-50/70 border-amber-200/90 shadow-2xs"
                      : isUser
                      ? "bg-white border-stone-200/90 shadow-2xs"
                      : "bg-stone-50/80 border-stone-200/70"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isAssistant
                            ? "bg-amber-600"
                            : isUser
                            ? "bg-emerald-600"
                            : "bg-stone-500"
                        }`}
                      />
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isAssistant
                            ? "text-amber-900"
                            : isUser
                            ? "text-emerald-900"
                            : "text-stone-700"
                        }`}
                      >
                        {item.speakerName}
                      </span>
                      <span className="text-[11px] text-stone-400 font-normal">
                        • {isUser ? "You" : isAssistant ? "Ted Note" : "Speaker"}
                      </span>
                    </div>

                    <span className="text-[11px] text-stone-400 font-mono">
                      {format(new Date(item.timestamp), "h:mm:ss a")}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-stone-800 whitespace-pre-wrap">
                    {item.text}
                  </p>
                </div>
              );
            })}

            {(!session.timeline || session.timeline.length === 0) && (
              <div className="py-12 text-center text-stone-400 text-xs">
                No conversation turns recorded for this session.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
