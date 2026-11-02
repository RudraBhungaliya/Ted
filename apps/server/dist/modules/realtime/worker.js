import { subscribeEvent, REDIS_CHANNELS } from "./redis.js";
import { initializeDeepgramSession, sendAudioToDeepgram } from "./deepgram.js";
export async function startRealtimeWorker() {
    try {
        console.log("Realtime worker starting...");
        await subscribeEvent(REDIS_CHANNELS.audio, async (payload) => {
            try {
                console.log("Worker received audio event:", payload.sessionId);
                initializeDeepgramSession(payload.sessionId);
                sendAudioToDeepgram(payload.sessionId, Buffer.from(payload.audio, "base64"));
            }
            catch (err) {
                console.error("Realtime worker error:", err);
            }
        });
        console.log("Realtime worker successfully registered");
    }
    catch (err) {
        console.warn("Realtime worker could not subscribe (Redis will retry):", err);
    }
}
