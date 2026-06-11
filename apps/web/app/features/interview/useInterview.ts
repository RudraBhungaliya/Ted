import { RealtimeClient } from "../../lib/realtime/client";
import { useInterviewStore } from "./store";
import { getSession } from "../../lib/api/session";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
  "http://localhost:4000";

let activeClient: RealtimeClient | null = null;

function speakerRole(
  speakerType?: "USER" | "PARTICIPANT" | "AI",
): "user" | "assistant" | "interviewer" | "ai" {
  if (speakerType === "USER") return "user";
  if (speakerType === "AI") return "ai";
  if (speakerType === "PARTICIPANT") return "interviewer";
  return "user";
}

function handleTranscript(
  text: string,
  isFinal: boolean,
  meta?: {
    speakerName?: string;
    speakerType?: "USER" | "PARTICIPANT" | "AI";
    triggerAi?: boolean;
  },
) {
  const mode = useInterviewStore.getState().sessionMode;
  const speakerName =
    meta?.speakerName ||
    (meta?.speakerType === "USER"
      ? "You"
      : meta?.speakerType === "PARTICIPANT"
        ? "Interviewer"
        : "Unknown");

  if (!isFinal) {
    if (mode === "meeting" || meta?.speakerType === "PARTICIPANT") {
      useInterviewStore.getState().setPartialTranscript(text);
    }
    return;
  }

  useInterviewStore.getState().setPartialTranscript("");

  useInterviewStore.getState().addTranscriptTurn({
    role: speakerRole(meta?.speakerType),
    speakerName,
    text,
  });

  if (mode === "meeting") {
    useInterviewStore.getState().setFinalTranscript(text);
  }
}

function connectHandlers() {
  return {
    onTranscript: handleTranscript,
    onAiToken: (token: string) => {
      useInterviewStore.getState().appendAiToken(token);
    },
    onAiStart: () => {
      useInterviewStore.getState().setAiResponding(true);
      useInterviewStore.getState().clearAiResponse();
      useInterviewStore.getState().setError(null);
    },
    onAiEnd: () => {
      useInterviewStore.getState().setAiResponding(false);
      const finalResponse = useInterviewStore.getState().aiResponse;
      if (finalResponse) {
        useInterviewStore.getState().addTranscriptTurn({
          role: "ai",
          speakerName: "TED (AI)",
          text: finalResponse,
        });
      }
    },
    onStatus: (status: string) => {
      useInterviewStore.getState().setStatus(status);
    },
    onError: (message: string) => {
      useInterviewStore.getState().setError(message);
    },
  };
}

async function startInterview() {
  if (useInterviewStore.getState().isRecording) {
    return;
  }
  try {
    const currentMode = useInterviewStore.getState().sessionMode;

    const response = await fetch(`${API_URL}/api/session/create`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: currentMode === "meeting" ? "MEETING" : "INTERVIEW",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create session.");
    }

    const data = await response.json();
    const realtimeSessionId = data.session.id;

    useInterviewStore.getState().clear();
    useInterviewStore.getState().start(realtimeSessionId);

    // Load initial timeline history if it exists
    try {
      const sessionData = await getSession(realtimeSessionId);
      const mappedHistory = (sessionData.timeline || []).map((t: any) => ({
        id: t.id,
        role: t.role,
        speakerName: t.speakerName,
        text: t.text,
      }));
      useInterviewStore.getState().setHistory(mappedHistory);
    } catch (err) {
      console.warn("Failed to load initial session timeline:", err);
    }

    const handlers = connectHandlers();
    const client = new RealtimeClient();
    activeClient = client;

    await client.connect(
      realtimeSessionId,
      handlers.onTranscript,
      handlers.onAiToken,
      handlers.onAiStart,
      handlers.onAiEnd,
      handlers.onStatus,
      handlers.onError,
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
        await fetch(`${API_URL}/api/session/end/${sessionId}`, {
          method: "POST",
          credentials: "include",
        });
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
      await fetch(`${API_URL}/api/session/end/${sessionId}`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Failed to end session", err);
    }
  }

  window.dispatchEvent(new Event("session-stopped"));

  const desktopControls = (window as any).desktopControls;
  if (desktopControls?.stopSession) {
    desktopControls.stopSession(sessionId);
  }
}

export const useInterview = () => {
  const handleSetMode = (mode: "interview" | "meeting") => {
    if (useInterviewStore.getState().isRecording) {
      return;
    }
    useInterviewStore.getState().setSessionMode(mode);
  };

  return {
    handleStart: startInterview,
    handleStop: stopInterview,
    handleSetMode,
  };
};
