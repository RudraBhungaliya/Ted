import {
  createClient,
  LiveTranscriptionEvents,
} from "@deepgram/sdk";

import { env } from "../../config/env.js";

import {
  emitPartialTranscript,
  emitFinalTranscript,
  emitSpeechFinal,
} from "./transcript.js";

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
    endpointing: 300,
    encoding: "linear16",
    sample_rate: 16000,
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

  connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
    const text = data.channel?.alternatives?.[0]?.transcript;

    if (!text) {
      return;
    }

    if (data.is_final) {
      emitFinalTranscript(sessionId, text);

      if (data.speech_final) {
        void emitSpeechFinal(sessionId);
      }

      return;
    }

    emitPartialTranscript(sessionId, text);
  });

  connection.on(LiveTranscriptionEvents.Error, (error: unknown) => {
    console.error("Deepgram error:", error);
  });

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log("Deepgram closed:", sessionId);
    sessionState.isOpen = false;
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
