/**
 * transcript.ts  (apps/server/src/modules/realtime/transcript.ts)
 *
 * Key fix: after finalizeAiTurn(), save the AI reply to the `transcript` table
 * with speakerType "AI" so the session chat contains all 3 parties:
 *   PARTICIPANT (interviewer) → AI (ted's reply) → USER (what you actually said)
 */

import { realtimeManager } from "./manager.js";
import { REALTIME_EVENTS } from "./events.js";
import { streamGeminiReply } from "../ai/providers/gemini.js";
import { saveTranscript } from "../transcript/service.js";
import { db } from "../../db/client.js";

// ─── Partial transcript buffer (per session, per speaker) ───────────────────

const partialBuffers = new Map<string, string>();

export function emitPartialTranscript(
  sessionId: string,
  text: string,
  speakerName: string,
) {
  partialBuffers.set(`${sessionId}:${speakerName}`, text);
  const socket = realtimeManager.getSocket(sessionId);
  if (!socket) return;

  socket.send(
    JSON.stringify({
      event: REALTIME_EVENTS.transcript.partial,
      payload: {
        sessionId,
        text,
        speakerName,
        speakerType: "PARTICIPANT",
        isFinal: false,
        triggerAi: false,
      },
    }),
  );
}

// ─── Emit any transcript event to the frontend ──────────────────────────────

export function emitTranscriptEvent(
  sessionId: string,
  payload: {
    sessionId: string;
    text: string;
    speakerName: string;
    speakerType: "USER" | "PARTICIPANT" | "AI";
    isFinal: boolean;
    triggerAi: boolean;
  },
) {
  const socket = realtimeManager.getSocket(sessionId);
  if (!socket) return;

  const event = payload.isFinal
    ? REALTIME_EVENTS.transcript.final
    : REALTIME_EVENTS.transcript.partial;

  socket.send(JSON.stringify({ event, payload }));
}

// ─── Accumulate interviewer segments before committing ──────────────────────

export function appendInterviewerSegment(sessionId: string, text: string) {
  console.log(
    "[QUESTION BUFFER +]",
    sessionId,
    text
  );
  realtimeManager.appendFinalSegment(sessionId, text);
}

// ─── Track what you (USER) said — stored for session history ────────────────

export async function trackUserSpeech(sessionId: string, text: string) {
  realtimeManager.appendUserTurn(sessionId, text);
}

// ─── Speech final: commit pending interviewer text and kick off AI ───────────

let speechFinalTimers = new Map<string, NodeJS.Timeout>();
const QUESTION_COMMIT_DEBOUNCE_MS = 1200;

export function emitSpeechFinal(sessionId: string) {
  console.log(
    "[EMIT SPEECH FINAL]",
    sessionId
  );
  // Debounce shortened to 80ms — just a coalescing guard, not a deliberate
  // wait. Deepgram's own endpointing (env.DEEPGRAM_ENDPOINTING_MS) already
  // provides the real "stopped talking" delay.
  const existing = speechFinalTimers.get(sessionId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    speechFinalTimers.delete(sessionId);
    await triggerAiReply(sessionId);
  }, QUESTION_COMMIT_DEBOUNCE_MS);

  speechFinalTimers.set(sessionId, timer);
}

// ─── Core AI reply flow ──────────────────────────────────────────────────────

async function triggerAiReply(sessionId: string) {
  if (realtimeManager.isAiStreaming(sessionId)) {
    console.log("[Transcript] AI already streaming for", sessionId, "— skipping.");
    return;
  }

  const question = realtimeManager.commitUserTurn(sessionId);
  console.log(
    "[QUESTION COMMITTED]",
    question
  );
  if (!question.trim()) {
    console.log("[Transcript] No pending interviewer text to answer.");
    return;
  }

  const turns = realtimeManager.getTurns(sessionId);
  const socket = realtimeManager.getSocket(sessionId);
  if (!socket) return;

  const session = realtimeManager.getSession(sessionId);
  const mode = session?.mode === "meeting" ? "meeting" : "interview";

  realtimeManager.setAiStreaming(sessionId, true);

  // Notify frontend: AI is starting
  socket.send(JSON.stringify({ event: REALTIME_EVENTS.ai.start, payload: { sessionId } }));

  try {
    console.log(
      "[STARTING GEMINI]",
      question
    );
    // Stream tokens from Gemini
    await streamGeminiReply(
      sessionId,
      question,
      turns,
      (token: string) => {
        // 1. Accumulate in memory
        realtimeManager.appendAiToken(sessionId, token);

        // 2. Stream token to frontend immediately
        socket.send(
          JSON.stringify({
            event: REALTIME_EVENTS.ai.token,
            payload: { sessionId, token },
          }),
        );
      },
      mode,
    );
    console.log(
      "[GEMINI FINISHED]"
    );

    // All tokens received — finalize the turn in memory
    const fullAiReply = realtimeManager.finalizeAiTurn(sessionId);

    // ─── FIX: Save AI reply to DB so session chat has all 3 parties ───────
    if (fullAiReply.trim()) {
      await db.aiMessage.create({
        data: {
          sessionId,
          provider: "gemini",
          model: "gemini-2.5-flash",
          text: fullAiReply,
        },
      });
      await saveTranscript(sessionId, "Ted (AI)", "AI", fullAiReply);
    }
    // ──────────────────────────────────────────────────────────────────────

    // Notify frontend: AI done
    socket.send(JSON.stringify({ event: REALTIME_EVENTS.ai.end, payload: { sessionId } }));
  } catch (err) {
    console.error("[Transcript] Gemini stream error:", err);
    realtimeManager.finalizeAiTurn(sessionId); // clear tokens even on error

    socket.send(
      JSON.stringify({
        event: REALTIME_EVENTS.ai.error,
        payload: { sessionId, message: "AI response failed. Please try again." },
      }),
    );
  } finally {
    realtimeManager.setAiStreaming(sessionId, false);
  }
}
