import {
    FastifyInstance,
} from "fastify";

import fastifyWebsocket from "@fastify/websocket";

import {
    REALTIME_EVENTS,
} from "./events.js";

import {
    realtimeManager,
} from "./manager.js";

export async function realtimeGateway(
    app : FastifyInstance,
){
    await app.register( fastifyWebsocket);

    app.get(
        "/realtime", {
            websocket : true,
        } as any,
        (connection: any, req: any) => {
            const socket = connection.socket;

            socket.on(
                "message",
                async (rawMessage: string | Buffer) => {
                    try {
                        const message = JSON.parse(
                            rawMessage.toString(),
                        );

                        const { event, payload } = message;

                        if (event === REALTIME_EVENTS.session.start) {
                            realtimeManager.createSession(payload.sessionId);
                            realtimeManager.attachSocket(payload.sessionId, socket);

                            socket.send(
                                JSON.stringify({
                                    event : REALTIME_EVENTS.connection.connected,
                                    payload : {
                                        sessionId : payload.sessionId,
                                    },
                                })
                            );
                        }

                        if (event === REALTIME_EVENTS.audio.chunk) {
                            console.log("Audio chunk received", payload);
                        }
                    }
                    catch(err){
                        socket.send(
                            JSON.stringify({
                                event : REALTIME_EVENTS.connection.error,
                                payload : {
                                    message : "Invalid Message",
                                },
                            })
                        );
                    }
                }
            );

            connection.socket.on(
                "close",
                () => {
                    console.log("Socket Disconnected");
                }
            );
        }
    );
}
