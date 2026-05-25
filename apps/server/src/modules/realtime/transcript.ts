import { realtimeManager } from "./manager.js";
import { REALTIME_EVENTS } from "./events.js";
import { streamAiResponse } from "../ai/stream.js";
import { interruptAiStream } from "./stream.js";
import { env } from "../../config/env.js";
import { db } from "../../db/client.js";

const AI_RESPONSE_DEBOUNCE_MS = Number(env.AI_RESPONSE_DEBOUNCE_MS);

const responseTimers = new Map<string, NodeJS.Timeout>();

function scheduleAiResponse(sessionId: string) {
  const existingTimer = responseTimers.get(sessionId);

  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    responseTimers.delete(sessionId);
    void emitSpeechFinal(sessionId);
  }, AI_RESPONSE_DEBOUNCE_MS);

  responseTimers.set(sessionId, timer);
}

export function emitPartialTranscript(sessionId: string, text: string) {
  if (realtimeManager.isAiStreaming(sessionId)) {
    interruptAiStream(sessionId);
    realtimeManager.setAiStreaming(sessionId, false);
  }

  const socket = realtimeManager.getSocket(sessionId);

  if (!socket) return;

  socket.send(
    JSON.stringify({
      event: REALTIME_EVENTS.transcript.partial,
      payload: {
        sessionId,
        text,
      },
    }),
  );
}

export async function emitFinalTranscript(sessionId: string, text: string) {
  realtimeManager.appendFinalSegment(sessionId, text);

  await db.transcript.create({
    data: {
      sessionId,

      role: "interviewer",

      text,
    },
  });

  const socket = realtimeManager.getSocket(sessionId);

  if (!socket) return;

  socket.send(
    JSON.stringify({
      event: REALTIME_EVENTS.transcript.final,
      payload: {
        sessionId,
        text: realtimeManager.getLatestUserTurn(sessionId),
      },
    }),
  );

  scheduleAiResponse(sessionId);
}

export async function emitSpeechFinal(sessionId: string) {
  const pendingTimer = responseTimers.get(sessionId);

  if (pendingTimer) {
    clearTimeout(pendingTimer);
    responseTimers.delete(sessionId);
  }

  if (realtimeManager.isAiStreaming(sessionId)) {
    scheduleAiResponse(sessionId);
    return;
  }

  const committed = realtimeManager.commitUserTurn(sessionId);

  if (!committed.trim()) {
    return;
  }

  const turns = realtimeManager.getTurns(sessionId);
  await streamAiResponse(sessionId, turns);
}
