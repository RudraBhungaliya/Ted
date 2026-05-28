"use client";

import { useEffect, useState } from "react";
import { getSession } from "../../lib/api/session";
import { SessionMessage } from "../../components/session-message";

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

export default function SessionDetailPage({
  params,
}: {
  params: {
    sessionId: string;
  };
}) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSession(params.sessionId);
        setSession(data.session);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [params.sessionId]);

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
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1
        className="
          text-3xl
          font-bold
          mb-8
        "
      >
        Session Replay
      </h1>

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
