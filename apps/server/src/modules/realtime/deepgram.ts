import {
    createClient,
    LiveTranscriptionEvents,
} from "@deepgram/sdk";

import {
    env,
} from "../../config/env.js";

import {
    emitPartialTranscript,
    emitFinalTranscript,
} from "./transcript.js";

const deepgram =
    createClient(
        env.DEEPGRAM_API_KEY,
    );

const connections =
    new Map<string, any>();

export function initializeDeepgramSession(
    sessionId: string,
) {

    if (
        connections.has(
            sessionId,
        )
    ) {
        return;
    }

    const connection =
        deepgram.listen.live({

            model: "nova-2",

            language: "en-US",

            smart_format: true,

            interim_results: true,

            punctuate: true,

            endpointing: 100,

        });

    connection.on(
        LiveTranscriptionEvents.Open,

        () => {

            console.log(
                "Deepgram connected:",
                sessionId,
            );

        },
    );

    connection.on(
        LiveTranscriptionEvents.Transcript,

        (data: any) => {

            const text =
                data.channel
                    ?.alternatives?.[0]
                    ?.transcript;

            if (!text) {
                return;
            }

            const isFinal =
                data.is_final;

            if (isFinal) {

                emitFinalTranscript(
                    sessionId,
                    text,
                );

                return;

            }

            emitPartialTranscript(
                sessionId,
                text,
            );

        },
    );

    connection.on(
        LiveTranscriptionEvents.Error,

        (error: any) => {

            console.error(
                "Deepgram Error:",
                error,
            );

        },
    );

    connection.on(
        LiveTranscriptionEvents.Close,

        () => {

            console.log(
                "Deepgram closed:",
                sessionId,
            );

        },
    );

    connections.set(
        sessionId,
        connection,
    );

}

export function sendAudioToDeepgram(
    sessionId: string,
    audio: Buffer,
) {

    const connection =
        connections.get(
            sessionId,
        );

    if (!connection) {
        return;
    }

    connection.send(audio);

}

export function closeDeepgramSession(
    sessionId: string,
) {

    const connection =
        connections.get(
            sessionId,
        );

    if (!connection) {
        return;
    }

    connection.finish();

    connections.delete(
        sessionId,
    );

}