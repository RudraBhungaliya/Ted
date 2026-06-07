import { realtimeManager } from "./manager.js";
import { REALTIME_EVENTS } from "./events.js";
import { streamAiResponse } from "../ai/stream.js";
import { interruptAiStream } from "./stream.js";
import { db } from "../../db/client.js";
import { isDuplicateQuestion } from "../ai/detector.js";
import { analyzeAnswer } from "../analytics/service.js";
import { saveTranscript } from "../transcript/service.js";

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

  await saveTranscript(sessionId, "Interviewer", "PARTICIPANT", text);

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

  void emitSpeechFinal(sessionId);
}

export async function emitSpeechFinal(sessionId: string) {
  if (realtimeManager.isAiStreaming(sessionId)) {
    return;
  }

  const committed = realtimeManager.commitUserTurn(sessionId);

  if (!committed.trim()) {
    return;
  }

  await saveTranscript(sessionId, "User", "USER", committed);

  if (isDuplicateQuestion(sessionId, committed)) {
    console.log("Duplicate question ignored:", committed);

    return;
  }

  const turns = realtimeManager.getTurns(sessionId);

  const analytics = analyzeAnswer(committed);

  console.log("ANSWER ANALYTICS:", analytics);

  await db.sessionAnalytics.upsert({
    where: {
      sessionId,
    },

    create: {
      sessionId,

      totalWords: analytics.totalWords,

      fillerCount: analytics.fillerCount,

      confidenceScore: analytics.confidenceScore,
    },

    update: {
      totalWords: {
        increment: analytics.totalWords,
      },

      fillerCount: {
        increment: analytics.fillerCount,
      },

      confidenceScore: analytics.confidenceScore,
    },
  });

  await streamAiResponse(sessionId, turns);
}
