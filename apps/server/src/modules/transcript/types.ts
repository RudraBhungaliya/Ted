export interface CreateTranscriptInput {
    sessionId : string;
    speakerName : string;
    speakerType : "USER" | "AI" | "PARTICIPANT";
    text : string;
}