import {
    subscribeEvent,
    publishEvent,
    REDIS_CHANNELS,
} from "./redis.js";

import {
    emitPartialTranscript,
} from "./transcript.js";

export async function startRealtimeWorker(){
    await subscribeEvent(
        REDIS_CHANNELS.audio,

        async (payload) => {
            console.log("Processing audio data for session:");

            const transcript = await "simulated transcript";

            emitPartialTranscript(
                payload.sessionId,
                transcript,
            );

            await publishEvent(
                REDIS_CHANNELS.transcript,
                {
                    sessionId : payload.sessionId,
                    text : transcript,
                }
            );
        }
    );
}