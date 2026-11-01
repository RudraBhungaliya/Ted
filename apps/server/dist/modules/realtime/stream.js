import { realtimeManager, } from "./manager.js";
import { REALTIME_EVENTS, } from "./events.js";
export function startAiStream(sessionId) {
    realtimeManager.setAiStreaming(sessionId, true);
    const socket = realtimeManager.getSocket(sessionId);
    if (!socket)
        return;
    socket.send(JSON.stringify({
        event: REALTIME_EVENTS.ai.start,
        payload: {
            sessionId,
        },
    }));
}
export function streamAiToken(sessionId, token) {
    realtimeManager.appendAiToken(sessionId, token);
    const socket = realtimeManager.getSocket(sessionId);
    if (!socket)
        return;
    socket.send(JSON.stringify({
        event: REALTIME_EVENTS.ai.token,
        payload: {
            sessionId,
            token,
        }
    }));
}
export function interruptAiStream(sessionId) {
    const socket = realtimeManager.getSocket(sessionId);
    if (!socket)
        return;
    socket.send(JSON.stringify({
        event: REALTIME_EVENTS
            .ai
            .interrupt,
        payload: {
            sessionId,
        },
    }));
}
export function endAiStream(sessionId) {
    realtimeManager.setAiStreaming(sessionId, false);
    realtimeManager.finalizeAiTurn(sessionId);
    const socket = realtimeManager.getSocket(sessionId);
    if (!socket)
        return;
    socket.send(JSON.stringify({
        event: REALTIME_EVENTS.ai.end,
        payload: {
            sessionId,
        },
    }));
}
export function failAiStream(sessionId, message = "AI response failed.") {
    realtimeManager.setAiStreaming(sessionId, false);
    const socket = realtimeManager.getSocket(sessionId);
    if (!socket)
        return;
    socket.send(JSON.stringify({
        event: REALTIME_EVENTS.ai.error,
        payload: {
            sessionId,
            message,
        },
    }));
}
