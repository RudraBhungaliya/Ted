import { realtimeManager } from "./manager.js";
import { REALTIME_EVENTS } from "./events.js";
import { streamAiResponse } from "../ai/stream.js";
import { interruptAiStream } from "./stream.js";

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

export function emitFinalTranscript(sessionId: string, text: string) {
  realtimeManager.appendFinalSegment(sessionId, text);

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
}

export async function emitSpeechFinal(sessionId: string) {
  const committed = realtimeManager.commitUserTurn(sessionId);

  if (!committed.trim()) {
    return;
  }

  const turns = realtimeManager.getTurns(sessionId);
  await streamAiResponse(sessionId, turns);
}
