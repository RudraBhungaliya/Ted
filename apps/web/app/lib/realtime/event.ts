export const REALTIME_EVENTS = {
    session : {
        start : 
            "session.start",
    },
    audio : {
        chunk : 
            "audio.chunk",
    },
    transcript : {
        partial : 
            "transcript.partial",
        final : 
            "transcript.final",
    },
    ai : {
        token :
            "ai.token",
    },
} as const;