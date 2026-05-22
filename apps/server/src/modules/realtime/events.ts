export const REALTIME_EVENTS = {
    connection : {
        connected :
            "connection.connected",
        disconnected : 
            "connection.disconnected",
        error : 
            "connection.error",
    },
    audio : {
        chunk : 
            "audio.chunk",
        start : 
            "audio.start",
        stop :
            "audio.stop",
        end : 
            "audio.end",
        interupt :
            "audio.interupt",
    },
    transcript : {
        partial : 
            "transcript.partial",
        final :
            "transcript.final",
    },
    ai : {
        start : 
            "ai.start",
        end : 
            "ai.end",
        error :
            "ai.error",
        interrupt :
            "ai.interupt",
        token : 
            "ai.token",
    },
    session : {
        start : 
            "session.start",
        end : 
            "session.end",
        sync : 
            "session.sync",
    },
} as const;
