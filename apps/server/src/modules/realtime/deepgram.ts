import { Deepgram } from "@deepgram/sdk";
import { env } from "../../config/env.js";
import { emitPartialTranscript, emitFinalTranscript } from "./transcript.js";

const deepgram: any = new Deepgram({
    apiKey: env.DEEPGRAM_API_KEY,
});

const connections = new Map<string, any>();

export function initializeDeepgramSession(sessionId: string) {
    if (connections.has(sessionId)) return;

    const connection = deepgram.listen.live({
        model: "nova-2",
        language: "en-US",
        smart_format: true,
        interim_results: true,
        punctuate: true,
        endpointing: 100,
    });

    connection.on("transcript.received", () => {
        console.log("Deepgram connected");
    });

    connection.on("transcript.partially_received", (data: any) => {
        const text = data.channel?.alternatives?.[0]?.transcript;

        if (!text) return;

        const isFinal = data.is_final;

        if (isFinal) {
            emitFinalTranscript(sessionId, text);
            return;
        }

        emitPartialTranscript(sessionId, text);
    });

    connection.on("transcript.error", (error: any) => {
        console.error("Deepgram Error", error);
    });

    connections.set(sessionId, connection);
}

export const sendAudioToDeepgram = (sessionId: string, audio: Buffer) => {
    const connection = connections.get(sessionId);
    if (!connection) return;

    connection.send(audio);
};

export function closeDeepgramSession(sessionId: string) {
    const connection = connections.get(sessionId);
    if (!connection) return;

    connection.finish();
    connections.delete(sessionId);
}