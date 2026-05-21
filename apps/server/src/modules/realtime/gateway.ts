import { FastifyInstance } from "fastify";

import {
    redis
} from "../../lib/redis.js";

import { REALTIME_EVENTS } from "./events.js";

import { realtimeManager } from "./manager.js";

export async function realtimeGateway(app: FastifyInstance) {
  console.log("Realtime gateway registered");
  app.get(
    "/realtime",
    {
      websocket: true,
    },
    (connection, req) => {
      connection.socket.on("message", async (rawMessage: string | Buffer) => {
        try {
          const message = JSON.parse(rawMessage.toString());

          const { event, payload } = message;

          if (event === REALTIME_EVENTS.session.start) {
            realtimeManager.createSession(payload.sessionId);
            realtimeManager.attachSocket(payload.sessionId, connection.socket);

            connection.socket.send(
              JSON.stringify({
                event: REALTIME_EVENTS.connection.connected,
                payload: {
                  sessionId: payload.sessionId,
                },
              }),
            );
          }

          if (event === REALTIME_EVENTS.audio.chunk) {
            console.log("Audio chunk received");

            await redis.publish(
              "realtime:audio",

              JSON.stringify({
                sessionId: payload.sessionId,

                audio: payload.audio,
              }),
            );
          }
        } catch (err) {
          connection.socket.send(
            JSON.stringify({
              event: REALTIME_EVENTS.connection.error,
              payload: {
                message: "Invalid Message",
              },
            }),
          );
        }
      });

      connection.socket.on("close", () => {
        console.log("Socket Disconnected");
      });
    },
  );
}
