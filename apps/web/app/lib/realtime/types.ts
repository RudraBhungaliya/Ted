export type TranscriptMessage = {
    text : string;
    isFinal : boolean;
};

export type AudioChunkPayload = {
    sessionId : string;
    chunkId : number;
    audio : string;
};
