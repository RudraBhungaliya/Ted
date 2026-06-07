"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
  "http://localhost:4000";
import { useParams } from "next/navigation";

export default function SessionPage() {
  const params = useParams();

  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch(
          `${API_URL}/api/session/${sessionId}`,
          {
            credentials: "include",
          },
        );

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
      <main className="min-h-screen bg-[#090D1A] text-white flex items-center justify-center">
        Loading session...
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-[#090D1A] text-white flex items-center justify-center">
        Session not found
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090D1A] text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          {session.title || "TED Session"}
        </h1>

        <div className="grid gap-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold mb-4">Session Details</h2>

            <div className="space-y-2 text-sm">
              <p>
                <strong>ID:</strong> {session.id}
              </p>

              <p>
                <strong>Mode:</strong> {session.mode}
              </p>

              <p>
                <strong>Status:</strong> {session.status}
              </p>

              <p>
                <strong>Started:</strong>{" "}
                {new Date(session.startedAt).toLocaleString()}
              </p>

              {session.endedAt && (
                <p>
                  <strong>Ended:</strong>{" "}
                  {new Date(session.endedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold mb-4">Analytics</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-zinc-400 text-sm">Words</div>
                <div className="text-2xl font-bold">
                  {session.analytics?.totalWords ?? 0}
                </div>
              </div>

              <div>
                <div className="text-zinc-400 text-sm">Fillers</div>
                <div className="text-2xl font-bold">
                  {session.analytics?.fillerCount ?? 0}
                </div>
              </div>

              <div>
                <div className="text-zinc-400 text-sm">Confidence</div>
                <div className="text-2xl font-bold">
                  {session.analytics?.confidenceScore ?? 0}
                </div>
              </div>

              <div>
                <div className="text-zinc-400 text-sm">Communication</div>
                <div className="text-2xl font-bold">
                  {session.analytics?.communicationScore ?? 0}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold mb-4">Summary</h2>

            {session.summary ? (
              <>
                <p className="mb-6 text-zinc-300">{session.summary.overview}</p>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Key Points</h3>

                  <ul className="list-disc ml-6 space-y-1">
                    {session.summary.keyPoints.map(
                      (point: string, idx: number) => (
                        <li key={idx}>{point}</li>
                      ),
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Action Items</h3>

                  <ul className="list-disc ml-6 space-y-1">
                    {session.summary.actionItems.map(
                      (item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ),
                    )}
                  </ul>
                </div>
              </>
            ) : (
              <p>No summary generated.</p>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold mb-4">Transcript</h2>

            <div className="space-y-3">
              {session.transcripts?.map((t: any) => (
                <div
                  key={t.id}
                  className="border border-white/5 rounded-lg p-3"
                >
                  <div className="text-indigo-400 text-sm font-medium">
                    {t.speakerName} ({t.speakerType})
                  </div>

                  <div className="mt-2 text-zinc-200">{t.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold mb-4">AI Responses</h2>

            <div className="space-y-3">
              {session.aiMessages?.map((m: any) => (
                <div
                  key={m.id}
                  className="border border-white/5 rounded-lg p-3"
                >
                  <div className="text-green-400 text-sm font-medium">TED</div>

                  <div className="mt-2 text-zinc-200">{m.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
