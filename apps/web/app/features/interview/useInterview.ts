import { RealtimeClient } from "../../lib/realtime/client";

import { useInterviewStore } from "./store";

// Module-level singleton so start and stop always reference the same client
let activeClient: RealtimeClient | null = null;

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

    useInterviewStore.getState().clearAiResponse();
    useInterviewStore.getState().start(realtimeSessionId);

    const client = new RealtimeClient();
    activeClient = client;

    await client.connect(
      realtimeSessionId,

      (text, isFinal) => {
        if (isFinal) {
          useInterviewStore.getState().setFinalTranscript(text);
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
  return {
    handleStart: startInterview,
    handleStop: stopInterview,
  };
};
