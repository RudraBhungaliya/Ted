import { sessions } from "./sessions";
import { emit } from "./eventBus";
import { transcribe } from "../stt";
import { streamGrok } from "../ai/grok";

export async function processAudio(sessionId : string){
    const session = sessions[sessionId];
    if(!session) return;

    session.lastActive = Date.now();

    if(session.buffer.length < 3) return;// waaut for ~1s

    const buffer = session.buffer;
    session.buffer = [];

    // STT
    const text = await transcribe(buffer);

    if(!text) return;

    emit(sessionId, {
        type : "transcription",
        text,
    });

    // AI
    await streamGrok(text, (chunk) => {
        emit(sessionId, {
            type : "ai",
            text : chunk,
        });
    });
}