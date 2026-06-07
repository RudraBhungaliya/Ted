import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

import { env } from "../../config/env.js";

import {
  emitPartialTranscript,
  emitFinalTranscript,
  emitSpeechFinal,
} from "./transcript.js";

import { realtimeManager } from "./manager.js";
import { saveTranscript } from "../transcript/service.js";
import { REALTIME_EVENTS } from "./events.js";

const deepgram = createClient(env.DEEPGRAM_API_KEY);

interface DeepgramSession {
  connection: ReturnType<ReturnType<typeof createClient>["listen"]["live"]>;
  isOpen: boolean;
  queue: Buffer[];
}

const connections = new Map<string, DeepgramSession>();

export function initializeDeepgramSession(sessionId: string) {
  if (connections.has(sessionId)) {
    return;
  }

  const connection = deepgram.listen.live({
    model: "nova-2",
    language: "en-US",
    smart_format: true,
    interim_results: true,
    punctuate: true,
    endpointing: Number(env.DEEPGRAM_ENDPOINTING_MS),
    encoding: "linear16",
    sample_rate: 16000,
    channels: 2,
    multichannel: true,
  });

  const sessionState: DeepgramSession = {
    connection,
    isOpen: false,
    queue: [],
  };

  connection.on(LiveTranscriptionEvents.Open, () => {
    console.log("Deepgram connected:", sessionId);
    sessionState.isOpen = true;

    while (sessionState.queue.length > 0) {
      const chunk = sessionState.queue.shift();
      if (chunk) {
        connection.send(chunk as unknown as ArrayBuffer);
      }
    }
  });

  connection.on(LiveTranscriptionEvents.Transcript, async (data: any) => {
    const channelAlternatives = data.channel?.alternatives?.[0];
    const text = channelAlternatives?.transcript;
    const isFinal = data.is_final;
    const channelIndex = data.channel_index ?? 0;

    if (data.speech_final) {
      void emitSpeechFinal(sessionId);
    }

    if (!text || !text.trim()) {
      return;
    }

    const currentSession = realtimeManager.getSession(sessionId);
    const isMeetingMode = currentSession?.mode === "meeting";
    const socket = realtimeManager.getSocket(sessionId);

    if (channelIndex === 0) {
      // ==========================================
      // CHANNEL 0: YOUR MICROPHONE (USER)
      // ==========================================
      if (isFinal) {
        await saveTranscript(sessionId, "User", "USER", text);
      }

      // Stream to panel layout ONLY when running a meeting session
      if (isMeetingMode && socket) {
        socket.send(
          JSON.stringify({
            event: isFinal
              ? REALTIME_EVENTS.transcript.final
              : REALTIME_EVENTS.transcript.partial,
            payload: { text: `User: ${text}` },
          }),
        );
      }
    } else if (channelIndex === 1) {
      // ==========================================
      // CHANNEL 1: MEETING STREAM (INTERVIEWER)
      // ==========================================
      if (isFinal) {
        await saveTranscript(sessionId, "Interviewer", "PARTICIPANT", text);

        if (!isMeetingMode) {
          // Uses your native stream system to trigger AI evaluation loops safely
          void emitFinalTranscript(sessionId, text);
          return;
        }
      }

      // If in meeting mode or dealing with partial transcripts, use default frame pathways
      if (isMeetingMode) {
        if (socket) {
          socket.send(
            JSON.stringify({
              event: isFinal
                ? REALTIME_EVENTS.transcript.final
                : REALTIME_EVENTS.transcript.partial,
              payload: { text: `Interviewer: ${text}` },
            }),
          );
        }
      } else {
        // Standard Interview Mode streaming back up to the overlay UI panel box
        if (isFinal) {
          void emitFinalTranscript(sessionId, text);
        } else {
          void emitPartialTranscript(sessionId, text);
        }
      }
    }
  });

  connection.on(LiveTranscriptionEvents.Error, (error: unknown) => {
    console.error("Deepgram error:", error);
  });

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log("Deepgram closed:", sessionId);
    sessionState.isOpen = false;

    const session = realtimeManager.getSession(sessionId);
    if (session) {
      console.log(
        "Deepgram disconnected unexpectedly. Reconnecting for session:",
        sessionId,
      );
      connections.delete(sessionId);
      setTimeout(() => {
        if (realtimeManager.getSession(sessionId)) {
          initializeDeepgramSession(sessionId);
        }
      }, 1000);
    }
  });

  connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
    void emitSpeechFinal(sessionId);
  });

  connections.set(sessionId, sessionState);
}

export function sendAudioToDeepgram(sessionId: string, audio: Buffer) {
  const sessionState = connections.get(sessionId);

  if (!sessionState) {
    return;
  }

  if (sessionState.isOpen) {
    sessionState.connection.send(audio as unknown as ArrayBuffer);
    return;
  }

  sessionState.queue.push(audio);
}

export function closeDeepgramSession(sessionId: string) {
  const sessionState = connections.get(sessionId);

  if (!sessionState) {
    return;
  }

  sessionState.connection.finish();
  connections.delete(sessionId);
}
