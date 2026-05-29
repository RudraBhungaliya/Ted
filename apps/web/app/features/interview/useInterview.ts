import { useEffect } from "react";
import { RealtimeClient } from "../../lib/realtime/client";
import { useInterviewStore } from "./store";

// Module-level singleton so start and stop always reference the same client
let activeClient: RealtimeClient | null = null;

async function resumeSession(sessionId: string) {
  try {
    const response = await fetch(`http://localhost:4000/api/session/${sessionId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch active session details");
    }

    const data = await response.json();
    const session = data.session;

    const userTurns = (session.transcripts || []).map((t: any) => ({
      id: t.id,
      role: "user" as const,
      text: t.text,
      timestamp: new Date(t.createdAt).getTime(),
    }));

    const assistantTurns = (session.aiMessages || []).map((m: any) => ({
      id: m.id,
      role: "assistant" as const,
      text: m.text,
      timestamp: new Date(m.createdAt).getTime(),
    }));

    const sortedTurns = [...userTurns, ...assistantTurns].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    useInterviewStore.getState().clearAiResponse();
    useInterviewStore.getState().setHistory(sortedTurns);
    if (session.mode) {
      useInterviewStore.getState().setSessionMode(session.mode === "meeting" ? "meeting" : "interview");
    }
    useInterviewStore.getState().start(sessionId);

    const client = new RealtimeClient();
    activeClient = client;

    await client.connect(
      sessionId,
      (text, isFinal) => {
        if (isFinal) {
          useInterviewStore.getState().setFinalTranscript(text);
          useInterviewStore.getState().addHistoryTurn({
            id: Math.random().toString(36).substring(2, 9),
            role: "user",
            text,
          });
          return;
        }

        useInterviewStore.getState().setPartialTranscript(text);
      },

      (token) => {
        useInterviewStore.getState().appendAiToken(token);
      },

      () => {
        useInterviewStore.getState().setAiResponding(true);
        useInterviewStore.getState().clearAiResponse();
        useInterviewStore.getState().setError(null);
      },

      () => {
        useInterviewStore.getState().setAiResponding(false);
        const finalResponse = useInterviewStore.getState().aiResponse;
        if (finalResponse) {
          useInterviewStore.getState().addHistoryTurn({
            id: Math.random().toString(36).substring(2, 9),
            role: "assistant",
            text: finalResponse,
          });
        }
      },

      (status) => {
        useInterviewStore.getState().setStatus(status);
      },

      (message) => {
        useInterviewStore.getState().setError(message);
      }
    );

    useInterviewStore.getState().setConnected(true);
    await client.startStreaming();
  } catch (err) {
    console.error("Failed to resume active session", err);
  }
}

async function startInterview() {
  if (useInterviewStore.getState().isRecording) {
    return;
  }
  try {
    const response = await fetch(
      "http://localhost:4000/api/session/create",

      {
        method: "POST",

        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to create session.");
    }

    const data = await response.json();

    const realtimeSessionId = data.session.id;

    useInterviewStore.getState().clear();
    useInterviewStore.getState().start(realtimeSessionId);

    const client = new RealtimeClient();
    activeClient = client;

    await client.connect(
      realtimeSessionId,

      (text, isFinal) => {
        if (isFinal) {
          useInterviewStore.getState().setFinalTranscript(text);
          useInterviewStore.getState().addHistoryTurn({
            id: Math.random().toString(36).substring(2, 9),
            role: "user",
            text,
          });
          return;
        }

        useInterviewStore.getState().setPartialTranscript(text);
      },

      (token) => {
        useInterviewStore.getState().appendAiToken(token);
      },

      () => {
        useInterviewStore.getState().setAiResponding(true);
        useInterviewStore.getState().clearAiResponse();
        useInterviewStore.getState().setError(null);
      },

      () => {
        useInterviewStore.getState().setAiResponding(false);
        const finalResponse = useInterviewStore.getState().aiResponse;
        if (finalResponse) {
          useInterviewStore.getState().addHistoryTurn({
            id: Math.random().toString(36).substring(2, 9),
            role: "assistant",
            text: finalResponse,
          });
        }
      },

      (status) => {
        useInterviewStore.getState().setStatus(status);
      },

      (message) => {
        useInterviewStore.getState().setError(message);
      },
    );

    useInterviewStore.getState().setConnected(true);

    await client.startStreaming();
  } catch (err) {
    console.error("Interview start failed", err);
    useInterviewStore
      .getState()
      .setError(err instanceof Error ? err.message : "Interview start failed.");
    useInterviewStore.getState().setStatus("Error");
    useInterviewStore.getState().setConnected(false);

    const sessionId = useInterviewStore.getState().realtimeSessionId;

    if (sessionId) {
      try {
        await fetch(
          `http://localhost:4000/api/session/end/${sessionId}`,

          {
            method: "POST",

            credentials: "include",
          },
        );
      } catch {}
    }

    useInterviewStore.getState().stop();
  }
}

async function stopInterview() {
  const sessionId = useInterviewStore.getState().realtimeSessionId;

  activeClient?.disconnect();

  activeClient = null;

  useInterviewStore.getState().setConnected(false);
  useInterviewStore.getState().stop();

  if (sessionId) {
    try {
      await fetch(
        `http://localhost:4000/api/session/end/${sessionId}`,

        {
          method: "POST",

          credentials: "include",
        },
      );
    } catch (err) {
      console.error("Failed to end session", err);
    }
  }

  window.dispatchEvent(new Event("session-stopped"));
}

export const useInterview = () => {
  useEffect(() => {
    async function checkActiveSession() {
      if (useInterviewStore.getState().isRecording || activeClient) return;

      try {
        const res = await fetch("http://localhost:4000/api/session/active", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            console.log("Resuming active session:", data.session.id);
            resumeSession(data.session.id);
          }
        }
      } catch (err) {
        console.error("Failed to check active session", err);
      }
    }

    void checkActiveSession();
  }, []);

  const handleSetMode = (mode: "interview" | "meeting") => {
    useInterviewStore.getState().setSessionMode(mode);
    if (activeClient) {
      activeClient.updateMode(mode);
    }
  };

  return {
    handleStart: startInterview,
    handleStop: stopInterview,
    handleSetMode,
  };
};

