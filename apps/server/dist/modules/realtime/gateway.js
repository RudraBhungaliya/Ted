import fastifyWebsocket from "@fastify/websocket";
import { REALTIME_EVENTS, } from "./events.js";
import { realtimeManager, } from "./manager.js";
export async function realtimeGateway(app) {
    await app.register(fastifyWebsocket);
    app.get("/realtime", {
        websocket: true,
    }, (connection, req) => {
        const socket = connection.socket;
        socket.on("message", async (rawMessage) => {
            try {
                const message = JSON.parse(rawMessage.toString());
                const { event, payload } = message;
                if (event === REALTIME_EVENTS.session.start) {
                    realtimeManager.createSession(payload.sessionId);
                    realtimeManager.attachSocket(payload.sessionId, socket);
                    socket.send(JSON.stringify({
                        event: REALTIME_EVENTS.connection.connected,
                        payload: {
                            sessionId: payload.sessionId,
                        },
                    }));
                }
                if (event === REALTIME_EVENTS.audio.chunk) {
                    console.log("Audio chunk received", payload);
                }
            }
            catch (err) {
                socket.send(JSON.stringify({
                    event: REALTIME_EVENTS.connection.error,
                    payload: {
                        message: "Invalid Message",
                    },
                }));
            }
        });
        connection.socket.on("close", () => {
            console.log("Socket Disconnected");
        });
    });
}
