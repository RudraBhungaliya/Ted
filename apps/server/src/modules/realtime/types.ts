import type { ConversationTurn } from "../ai/types.js";

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
    turns: ConversationTurn[];
    currentAiTokens: string[];
    pendingUserText: string;
    aiStreaming: boolean;
    connected : boolean;
    mode: "interview" | "meeting";
};

