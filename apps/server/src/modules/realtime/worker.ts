import { subscribeEvent, REDIS_CHANNELS } from "./redis.js";

import { initializeDeepgramSession, sendAudioToDeepgram } from "./deepgram.js";

export async function startRealtimeWorker() {
  console.log("Realtime worker started");

  await subscribeEvent(
    REDIS_CHANNELS.audio,

    async (payload) => {
      try {
        console.log("Worker received audio event:", payload.sessionId);

        initializeDeepgramSession(payload.sessionId);

        sendAudioToDeepgram(
          payload.sessionId,

          Buffer.from(payload.audio, "base64"),
        );
      } catch (err) {
        console.error("Realtime worker error:", err);
      }
    },
  );
}
