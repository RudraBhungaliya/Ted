import { realtimeManager } from "./manager.js";
import { REALTIME_EVENTS, } from "./events.js";
export function emitPartialTranscript(sessionId, text) {
    realtimeManager.appendTranscript(sessionId, text);
    const socket = realtimeManager.getSocket(sessionId);
    if (!socket)
        return;
    socket.send(JSON.stringify({
        event: REALTIME_EVENTS.transcript.partial,
        payload: {
            sessionId,
            text,
        },
    }));
}
export function emitFinalTranscript(sessionId, text) {
    realtimeManager.appendTranscript(sessionId, text);
    const socket = realtimeManager.getSocket(sessionId);
    if (!socket)
        return;
    socket.send(JSON.stringify({
        event: REALTIME_EVENTS.transcript.final,
        payload: {
            sessionId,
            text,
        },
    }));
}
