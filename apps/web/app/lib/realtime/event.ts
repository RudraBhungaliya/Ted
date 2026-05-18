export const REALTIME_EVENTS = {

    SESSION: {
        START:
            "session.start",
    },

    AUDIO: {
        CHUNK:
            "audio.chunk",
    },

    TRANSCRIPT: {
        PARTIAL:
            "transcript.partial",

        FINAL:
            "transcript.final",
    },

    AI: {
        TOKEN:
            "ai.token",
    },

} as const;