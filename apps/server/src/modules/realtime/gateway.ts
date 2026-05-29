import type { FastifyInstance } from "fastify";
import { db } from "../../db/client.js";

import { REALTIME_EVENTS } from "./events.js";

import { realtimeManager } from "./manager.js";

import {
  closeDeepgramSession,
  initializeDeepgramSession,
  sendAudioToDeepgram,
} from "./deepgram.js";

const disconnectTimers = new Map<string, NodeJS.Timeout>();

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
              const mode = payload.mode === "meeting" ? "meeting" : "interview";

              const pendingTimer = disconnectTimers.get(payload.sessionId);
              if (pendingTimer) {
                clearTimeout(pendingTimer);
                disconnectTimers.delete(payload.sessionId);
                console.log("Graceful reconnect within window:", payload.sessionId);
              }

              // Update session mode in DB
              try {
                await db.session.update({
                  where: { id: payload.sessionId },
                  data: { mode },
                });
              } catch (dbErr) {
                console.error("Failed to update session mode in DB:", dbErr);
              }

              // Restore session state from DB if needed
              const restored = await realtimeManager.restoreSession(payload.sessionId, mode);
              if (!restored) {
                realtimeManager.createSession(payload.sessionId, mode);
              }

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

              console.log("Session started/resumed:", payload.sessionId, "Mode:", mode);
            }

            if (event === REALTIME_EVENTS.session.updateMode && activeSessionId) {
              const mode = payload.mode === "meeting" ? "meeting" : "interview";
              const sessionState = realtimeManager.getSession(activeSessionId);
              if (sessionState) {
                sessionState.mode = mode;
              }
              try {
                await db.session.update({
                  where: { id: activeSessionId },
                  data: { mode },
                });
                console.log(`Updated session ${activeSessionId} mode to:`, mode);
              } catch (dbErr) {
                console.error("Failed to update mode in DB on updateMode event:", dbErr);
              }
            }

            if (event === REALTIME_EVENTS.session.end && activeSessionId) {
              // Cancel any pending reconnect timers
              const pendingTimer = disconnectTimers.get(activeSessionId);
              if (pendingTimer) {
                clearTimeout(pendingTimer);
                disconnectTimers.delete(activeSessionId);
              }

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
        console.log("Socket disconnected:", activeSessionId);

        if (activeSessionId) {
          // Instead of immediate deletion, wait for a grace period
          const sessionId = activeSessionId;
          const timer = setTimeout(() => {
            disconnectTimers.delete(sessionId);
            console.log("Grace period expired, cleaning up session:", sessionId);
            closeDeepgramSession(sessionId);
            realtimeManager.removeSession(sessionId);
          }, 15000);

          disconnectTimers.set(sessionId, timer);
        }
      });
    },
  );
}

