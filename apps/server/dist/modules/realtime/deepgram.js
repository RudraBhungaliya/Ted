import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { env } from "../../config/env.js";
import { emitPartialTranscript, emitFinalTranscript, } from "./transcript.js";
const deepgram = createClient(env.DEEPGRAM_API_KEY);
const connections = new Map();
export function initializeDeepgramSession(sessionId) {
    if (connections.has(sessionId))
        return;
    const connection = deepgram.transcription.live({
        model: "nova-2",
        language: "en-US",
        smart_format: true,
        interim_results: true,
        punctuate: true,
        endpointing: 100,
    });
    connection.on(LiveTranscriptionEvents.TranscriptReceived, () => {
        console.log("Deepgram connected");
    });
    connection.on(LiveTranscriptionEvents.TranscriptPartiallyReceived, (data) => {
        const text = data.channel
            ?.alternatives?.[0]
            ?.transcript;
        if (!text)
            return;
        const isFinal = data.is_final;
        if (isFinal) {
            emitFinalTranscript(sessionId, text);
            return;
        }
        emitPartialTranscript(sessionId, text);
    });
    connection.on(LiveTranscriptionEvents.TranscriptError, (error) => {
        console.error("Deepgram Error", error);
    });
    connections.set(sessionId, connection);
}
export const sendAudioToDeepgram = (sessionId, audio) => {
    const connection = connections.get(sessionId);
    if (!connection)
        return;
    connection.send(audio);
};
export function closeDeepgramSession(sessionId) {
    const connection = connections.get(sessionId);
    if (!connection)
        return;
    connection.finish();
    connections.delete(sessionId);
}
