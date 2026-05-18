import {
    subscribeEvent,
    publishEvent,
    REDIS_CHANNELS,
} from "./redis.js";

import {
    emitPartialTranscript,
} from "./transcript.js";

import {
    initializeDeepgramSession,
    sendAudioToDeepgram,
} from "./deepgram.js";

export async function startRealtimeWorker(){
    await subscribeEvent(
        REDIS_CHANNELS.audio,

        async (payload) => {
            console.log("Processing audio data for session:");

            initializeDeepgramSession(
                payload.sessionId
            );

            sendAudioToDeepgram(
                payload.sessionId,

                Buffer.from(
                    payload.audio,
                    "base64"
                )
            );

            // Audio forwarded to Deepgram; transcription events are
            // handled by the Deepgram session and emitted from there.
        }
    );
}