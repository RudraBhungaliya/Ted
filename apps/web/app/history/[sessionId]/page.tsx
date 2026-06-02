"use client";

import { useEffect, useState, use } from "react";
import { getSession } from "../../lib/api/session";
import { SessionMessage } from "../../components/session-message";
import { Award } from "lucide-react";

type Transcript = {
  id: string;
  text: string;
  createdAt: string;
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
};

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{
    sessionId: string;
  }>;
}) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSession(sessionId);

        setSession(data.session);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [sessionId]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!session) {
    return <div className="p-8">Session not found.</div>;
  }

  const messages = [
    ...session.transcripts.map((transcript: Transcript) => ({
      id: transcript.id,
      role: "user",
      text: transcript.text,
      createdAt: transcript.createdAt,
    })),

    ...session.aiMessages.map((message: AiMessage) => ({
      id: message.id,
      role: "assistant",
      text: message.text,
      createdAt: message.createdAt,
    })),
  ].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime(),
  );

  const latestAnalytics: Analytics | undefined =
    session.analytics?.[0];

  const summary = session.summary;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Session Replay</h1>

      {/* Analytics & Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {latestAnalytics && (
          <div className="md:col-span-1 border border-white/10 rounded-2xl p-6 bg-neutral-900/40 backdrop-blur-xl">
            <h2 className="text-lg font-bold mb-4">Pace & Format</h2>
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Words:</span>
                <span className="font-semibold text-white">{latestAnalytics.totalWords}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Filler Words:</span>
                <span className="font-semibold text-white">{latestAnalytics.fillerCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Confidence:</span>
                <span className="font-semibold text-white">{latestAnalytics.confidenceScore}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">STAR Format:</span>
                <span className={`font-semibold ${latestAnalytics.usesStarFormat ? 'text-green-400' : 'text-zinc-500'}`}>
                  {latestAnalytics.usesStarFormat ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        )}

        {summary && (
          <div className="md:col-span-2 border border-indigo-500/20 bg-indigo-500/5 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-400" />
                  Interview Coach Summary
                </h2>
                <div className="text-2xl font-extrabold bg-indigo-600 px-3 py-1 rounded-lg text-white">
                  {summary.score}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">Strengths</div>
                  <ul className="space-y-1">
                    {summary.strengths.slice(0, 3).map((s: string, idx: number) => (
                      <li key={idx} className="text-xs text-zinc-300 flex items-start gap-1">
                        <span className="text-green-500">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Weaknesses</div>
                  <ul className="space-y-1">
                    {summary.weaknesses.slice(0, 3).map((w: string, idx: number) => (
                      <li key={idx} className="text-xs text-zinc-300 flex items-start gap-1">
                        <span className="text-red-500">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Coach Recommendation</div>
              <p className="text-xs text-zinc-300 leading-relaxed italic">
                {summary.recommendations[0]}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {messages.map((message) => (
          <SessionMessage
            key={message.id}
            role={message.role}
            text={message.text}
          />
        ))}
      </div>
    </div>
  );
}