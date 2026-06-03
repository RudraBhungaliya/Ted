import { createTranscript, getSessionTranscripts } from "./repository.js";

export async function saveTranscript(
  sessionId: string,
  speakerName: string,
  speakerType: "USER" | "AI" | "PARTICIPANT",
  text: string,
) {
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

export async function getTranscript(sessionId: string) {
  return getSessionTranscripts(sessionId);
}
