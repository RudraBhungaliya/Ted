import {
    realtimeManager,
} from "./manager.js"

import {
    REALTIME_EVENTS,
} from "./events.js";

export function startAiStream(
    sessionId : string,
){
    realtimeManager.setAiStreaming(sessionId, true);

    const socket = realtimeManager.getSocket(sessionId);

    if(!socket) return;

    socket.send(
        JSON.stringify({
            event : REALTIME_EVENTS.ai.start,
            payload : {
                sessionId,
            },
        })
    );
}

export function streamAiToken(
    sessionId : string,
    token : string,
){
    realtimeManager.appendAiToken(
        sessionId,
        token,
    );

    const socket = realtimeManager.getSocket(sessionId);

    if(!socket) return;

    socket.send(
        JSON.stringify({
            event : REALTIME_EVENTS.ai.token,
            payload : {
                sessionId,
                token,
            }
        })
    );
}

export function interruptAiStream(
    sessionId : string,
){
    const socket =
        realtimeManager.getSocket(
            sessionId,
        );

    if(!socket) return;

    socket.send(
        JSON.stringify({
            event :
                REALTIME_EVENTS
                    .ai
                    .interrupt,

            payload : {
                sessionId,
            },
        }),
    );
}

export function endAiStream(
    sessionId : string,
){
    realtimeManager.setAiStreaming(sessionId, false);
    realtimeManager.finalizeAiTurn(sessionId);

    const socket = realtimeManager.getSocket(sessionId);

    if(!socket) return;

    socket.send(
        JSON.stringify({
            event : REALTIME_EVENTS.ai.end,
            payload : {
                sessionId,
            },
        })
    );
}