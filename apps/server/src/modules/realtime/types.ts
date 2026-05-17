export type ConnectionPayload = {
    sessionId : string;
};

export type AudioChunkPayload = {
    sessionId : string;
    chunkId : string;// base64 encoded audio chunk
    audio : Buffer;
};

export type TranscriptPartialPayload = {
    sessionId : string;
    text : string;
};

export type TranscriptFinalPayload = {
    sessionId : string;
    text : string;
};

export type AiEndPayload = {
    sessionId : string;
};

export type SessionState = {
    sessionId : string;
    transcript : string[];
    aiResponse : string[];
    connected : boolean;
};

