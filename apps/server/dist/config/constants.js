export const API_PREFIX = "api/v1";
export const SESSION_LIMITS = {
    FREE: {
        MAX_SESSIONS: 3,
        MAX_DURATION: 60 * 50 * 1000, // 50 min
    },
    PREMIUM: {
        MAX_SESSIONS: 250,
        MAX_DURTION: 20 * 60 * 60 * 1000, // 20 hr    
    },
};
export const REDIS_CHANNELS = {
    SESSION_EVENTS: "session-events",
    AI_STREAM: "ai-stream",
};
export const REDIS_KEYS = {
    SESSION: "session",
};
export const SESSION_TYPES = {
    INTERVIEW: "INTERVIEW",
    MEETING: "MEETING",
    PRACTISE: "PRACTISE",
};
