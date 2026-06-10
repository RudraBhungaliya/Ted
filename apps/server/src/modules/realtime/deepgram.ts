import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

import { env } from "../../config/env.js";

import {
  appendInterviewerSegment,
  emitPartialTranscript,
  emitSpeechFinal,
  emitTranscriptEvent,
  trackUserSpeech,
} from "./transcript.js";

import { realtimeManager } from "./manager.js";
import { saveTranscript } from "../transcript/service.js";

const deepgram = createClient(env.DEEPGRAM_API_KEY);

interface DeepgramSession {
  connection: ReturnType<ReturnType<typeof createClient>["listen"]["live"]>;
  isOpen: boolean;
  queue: Buffer[];
}

const connections = new Map<string, DeepgramSession>();

function getChannelIndex(data: { channel_index?: number | number[] }) {
  const index = data.channel_index;
  if (Array.isArray(index)) return index[0] ?? 0;
  return index ?? 0;
}

export function initializeDeepgramSession(sessionId: string) {
  if (connections.has(sessionId)) return;

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
    console.log("[Deepgram] Connected for session:", sessionId);
    sessionState.isOpen = true;
    while (sessionState.queue.length > 0) {
      const chunk = sessionState.queue.shift();
      if (chunk) connection.send(chunk as unknown as ArrayBuffer);
    }
  });

  connection.on(LiveTranscriptionEvents.Transcript, async (data: any) => {
    console.log(
  "[DEEPGRAM RAW]",
  JSON.stringify(data),
);
    const channelAlternatives = data.channel?.alternatives?.[0];
    const text = channelAlternatives?.transcript?.trim();
    const isFinal = data.is_final;
    const channelIndex = getChannelIndex(data);
    const currentSession = realtimeManager.getSession(sessionId);
    const isMeetingMode = currentSession?.mode === "meeting";

    // Trigger speech_final flush only from the interviewer channel (1)
    if (data.speech_final && channelIndex === 1) {
      void emitSpeechFinal(sessionId);
    }

    if (!text) return;

    if (channelIndex === 0) {
      // ─────────────────────────────────────────────────────────────────────
      // CHANNEL 0 = YOUR MIC
      //   • Record what you said (always save to transcript as USER)
      //   • NEVER trigger AI — you are reading AI's reply, not asking questions
      // ─────────────────────────────────────────────────────────────────────
      if (isFinal) {
        await saveTranscript(sessionId, "You", "USER", text);
        void trackUserSpeech(sessionId, text);

        emitTranscriptEvent(sessionId, {
          sessionId,
          text,
          speakerName: "You",
          speakerType: "USER",
          isFinal: true,
          triggerAi: false, // ← NEVER trigger AI from your own mic
        });
      } else if (isMeetingMode) {
        // Show partial captions for your speech in meeting mode only
        emitTranscriptEvent(sessionId, {
          sessionId,
          text,
          speakerName: "You",
          speakerType: "USER",
          isFinal: false,
          triggerAi: false,
        });
      }
      return;
    }

    if (channelIndex === 1) {
      // ─────────────────────────────────────────────────────────────────────
      // CHANNEL 1 = SYSTEM / SCREEN AUDIO (interviewer / meeting participant)
      //   • Record as PARTICIPANT
      //   • ALWAYS trigger AI on final — this is the question you need answered
      // ─────────────────────────────────────────────────────────────────────
      if (isFinal) {
        await saveTranscript(sessionId, "Interviewer", "PARTICIPANT", text);
        appendInterviewerSegment(sessionId, text);

        emitTranscriptEvent(sessionId, {
          sessionId,
          text,
          speakerName: "Interviewer",
          speakerType: "PARTICIPANT",
          isFinal: true,
          triggerAi: true, // ← ALWAYS trigger AI from system audio
        });

        // In interview mode, also flush the speech_final to kick off AI immediately
        if (!isMeetingMode) {
          void emitSpeechFinal(sessionId);
        }
      } else if (isMeetingMode) {
        // Partial captions for interviewer in meeting mode
        emitTranscriptEvent(sessionId, {
          sessionId,
          text,
          speakerName: "Interviewer",
          speakerType: "PARTICIPANT",
          isFinal: false,
          triggerAi: false,
        });
      } else {
        // Interview mode: show partial transcript while interviewer is speaking
        emitPartialTranscript(sessionId, text, "Interviewer");
      }
    }
  });

  connection.on(LiveTranscriptionEvents.Error, (error: unknown) => {
    console.error("[Deepgram] Error:", error);
  });

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log("[Deepgram] Closed for session:", sessionId);
    sessionState.isOpen = false;

    const session = realtimeManager.getSession(sessionId);
    if (session) {
      console.log("[Deepgram] Reconnecting for session:", sessionId);
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

export function sendAudioToDeepgram(
  sessionId: string,
  audio: Buffer,
) {
  console.log(
    "[DEEPGRAM AUDIO]",
    sessionId,
    audio.length,
  );

  const sessionState =
    connections.get(sessionId);

  if (!sessionState) {
    console.log(
      "[DEEPGRAM AUDIO] NO SESSION",
    );
    return;
  }

  if (sessionState.isOpen) {
    sessionState.connection.send(
      audio as unknown as ArrayBuffer,
    );
    return;
  }

  sessionState.queue.push(audio);
}

export function closeDeepgramSession(sessionId: string) {
  const sessionState = connections.get(sessionId);
  if (!sessionState) return;
  sessionState.connection.finish();
  connections.delete(sessionId);
}