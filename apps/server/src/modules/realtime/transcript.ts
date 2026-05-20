import { realtimeManager } from "./manager.js";

import { REALTIME_EVENTS } from "./events.js";

import { streamAiResponse } from "../ai/stream.js";

import type { ConversationTurn } from "../ai/types.js";

export async function emitPartialTranscript(sessionId: string, text: string) {
  realtimeManager.appendTranscript(sessionId, text);

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
  realtimeManager.appendTranscript(sessionId, text);

  const socket = realtimeManager.getSocket(sessionId);

  if (!socket) return;

  socket.send(
    JSON.stringify({
      event: REALTIME_EVENTS.transcript.final,
      payload: {
        sessionId,
        text,
      },
    }),
  );
  const fullTranscript = realtimeManager.getFullTranscript(sessionId);
  
  const turns: ConversationTurn[] = [
    {
      role: "user",
  
      text: fullTranscript,
  
      timestamp: Date.now(),
    },
  ];
  
  console.log("Starting AI stream...");
  
  await streamAiResponse(
    sessionId,
    turns,
  );
}

