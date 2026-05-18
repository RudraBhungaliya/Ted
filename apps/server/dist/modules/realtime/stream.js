import { realtimeManager, } from "./manager.js";
import { REALTIME_EVENTS, } from "./events.js";
export function startAiStream(sessionId) {
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
    realtimeManager.appendAiResponse(sessionId, token);
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
export function endAiStream(sessionId) {
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
