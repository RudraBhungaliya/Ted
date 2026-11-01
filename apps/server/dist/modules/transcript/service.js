import { createTranscript, getSessionTranscripts } from "./repository.js";
export async function saveTranscript(sessionId, speakerName, speakerType, text) {
    if (!text.trim()) {
        return;
    }
    return createTranscript({
        sessionId,
        speakerName,
        speakerType,
        text,
    });
}
export async function getTranscript(sessionId) {
    return getSessionTranscripts(sessionId);
}
