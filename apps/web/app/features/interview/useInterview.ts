import { RealtimeClient } from "../../lib/realtime/client";

import { dbService } from "../../lib/db/postgre";

import { useInterviewStore } from "./store";

// Module-level singleton so start and stop always reference the same client
let activeClient: RealtimeClient | null = null;
let activeDbSessionId: string | null = null;

async function startInterview() {
  try {
    const realtimeSessionId = crypto.randomUUID();

    useInterviewStore.getState().start(realtimeSessionId);

    try {
      const dbSession = await dbService.startDBSession("New Interview Session");
      activeDbSessionId = dbSession.id;
    } catch (err) {
      console.warn("DB session start failed (non-blocking):", err);
    }

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
    useInterviewStore.getState().stop();
  }
}

async function stopInterview() {
  useInterviewStore.getState().stop();

  activeClient?.disconnect();
  activeClient = null;

  useInterviewStore.getState().setConnected(false);

  if (activeDbSessionId) {
    try {
      await dbService.stopDBSession(activeDbSessionId);
    } catch (err) {
      console.error("Failed to stop DB session", err);
    }
  }

  activeDbSessionId = null;
  window.dispatchEvent(new Event("session-stopped"));
}

export const useInterview = () => {
  return {
    handleStart: startInterview,
    handleStop: stopInterview,
  };
};
