import type { FastifyInstance } from "fastify";

import { REALTIME_EVENTS } from "./events.js";

import { realtimeManager } from "./manager.js";

import {
  closeDeepgramSession,
  initializeDeepgramSession,
  sendAudioToDeepgram,
} from "./deepgram.js";

export async function realtimeGateway(app: FastifyInstance) {
  console.log("Realtime gateway registered");

  app.get(
    "/realtime",
    {
      websocket: true,
    },

    (socket) => {
      console.log("Socket connected");

      let activeSessionId: string | null = null;

      socket.on(
        "message",

        async (
          rawMessage: Buffer | ArrayBuffer | string,

          isBinary: boolean,
        ) => {
          try {
            if (isBinary) {
              if (!activeSessionId) {
                return;
              }

              const audio = Buffer.isBuffer(rawMessage)
                ? rawMessage
                : rawMessage instanceof ArrayBuffer
                  ? Buffer.from(new Uint8Array(rawMessage))
                  : Buffer.from(rawMessage as string);

              sendAudioToDeepgram(activeSessionId, audio);

              return;
            }

            const message = JSON.parse(rawMessage.toString());

            const { event, payload } = message;

            if (event === REALTIME_EVENTS.session.start) {
              activeSessionId = payload.sessionId;

              realtimeManager.createSession(payload.sessionId);

              realtimeManager.attachSocket(payload.sessionId, socket as any);

              initializeDeepgramSession(payload.sessionId);

              socket.send(
                JSON.stringify({
                  event: REALTIME_EVENTS.connection.connected,

                  payload: {
                    sessionId: payload.sessionId,
                  },
                }),
              );

              console.log("Session started:", payload.sessionId);
            }

            if (event === REALTIME_EVENTS.session.end && activeSessionId) {
              closeDeepgramSession(activeSessionId);

              realtimeManager.removeSession(activeSessionId);

              activeSessionId = null;

              console.log("Session ended");
            }
          } catch (err) {
            console.error("Gateway error:", err);

            socket.send(
              JSON.stringify({
                event: REALTIME_EVENTS.connection.error,

                payload: {
                  message: "Invalid realtime message",
                },
              }),
            );
          }
        },
      );

      socket.on("close", () => {
        console.log("Socket disconnected");

        if (activeSessionId) {
          closeDeepgramSession(activeSessionId);

          realtimeManager.removeSession(activeSessionId);
        }
      });
    },
  );
}
