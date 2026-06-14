import type { FastifyInstance } from "fastify";
import { db } from "../../db/client.js";
import { REALTIME_EVENTS } from "./events.js";
import { realtimeManager } from "./manager.js";
import {
  closeDeepgramSession,
  initializeDeepgramSession,
  sendAudioToDeepgram,
} from "./deepgram.js";
import { SESSION_LIMITS } from "../../config/constants.js";
import { billingRepository } from "../billing/billing.repository.js";
import { endSession } from "../session/service.js";

const disconnectTimers = new Map<string, NodeJS.Timeout>();
const durationTimers = new Map<string, NodeJS.Timeout>();

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

              console.log("[WS AUDIO RECEIVED]", audio.length);

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
                console.log(
                  "Graceful reconnect within window:",
                  payload.sessionId,
                );
              }

              // Enforce duration limits
              const dbSession = await db.session.findUnique({
                where: { id: payload.sessionId },
                include: { user: true },
              });

              if (dbSession) {
                const isPremium = await billingRepository.hasActiveSubscription(dbSession.userId);
                const maxDuration = isPremium
                  ? SESSION_LIMITS.PREMIUM.MAX_DURATION
                  : SESSION_LIMITS.FREE.MAX_DURATION;

                const elapsed = Date.now() - dbSession.startedAt.getTime();
                const remaining = maxDuration - elapsed;

                if (remaining <= 0) {
                  console.log("Session duration limit already reached:", payload.sessionId);
                  socket.send(
                    JSON.stringify({
                      event: REALTIME_EVENTS.connection.error,
                      payload: {
                        message: "Session duration limit reached. Please upgrade to Premium.",
                      },
                    })
                  );
                  socket.close();
                  try {
                    await endSession(payload.sessionId);
                  } catch (dbErr) {
                    console.error("Failed to force-end session in DB:", dbErr);
                  }
                  return;
                }

                // Clean up any existing duration timer
                const existingDurationTimer = durationTimers.get(payload.sessionId);
                if (existingDurationTimer) {
                  clearTimeout(existingDurationTimer);
                  durationTimers.delete(payload.sessionId);
                }

                // Set new duration limit timeout
                const limitTimer = setTimeout(async () => {
                  console.log("Force-ending session due to duration limit:", payload.sessionId);
                  try {
                    socket.send(
                      JSON.stringify({
                        event: REALTIME_EVENTS.connection.error,
                        payload: {
                          message: "Session duration limit reached. Please upgrade to Premium.",
                        },
                      })
                    );
                    socket.close();
                  } catch (err) {
                    console.error("Error ending websocket session after duration timeout:", err);
                  }
                  try {
                    await endSession(payload.sessionId);
                  } catch (err) {
                    console.error("Error marking session as ended in database:", err);
                  }
                  durationTimers.delete(payload.sessionId);
                }, remaining);

                durationTimers.set(payload.sessionId, limitTimer);
              }

              try {
                await db.session.update({
                  where: { id: payload.sessionId },
                  data: {
                    mode: mode === "meeting" ? "MEETING" : "INTERVIEW",
                  },
                });
              } catch (dbErr) {
                console.error("Failed to update session mode in DB:", dbErr);
              }

              const restored = await realtimeManager.restoreSession(
                payload.sessionId,
                mode,
              );
              if (!restored) {
                realtimeManager.createSession(payload.sessionId, mode);
              }

              realtimeManager.attachSocket(payload.sessionId, socket as any);

              // Triggers deepgram configurations
              initializeDeepgramSession(payload.sessionId);

              socket.send(
                JSON.stringify({
                  event: REALTIME_EVENTS.connection.connected,
                  payload: {
                    sessionId: payload.sessionId,
                  },
                }),
              );

              console.log(
                "Session started/resumed:",
                payload.sessionId,
                "Mode:",
                mode,
              );
            }

            if (
              event === REALTIME_EVENTS.session.updateMode &&
              activeSessionId
            ) {
              const mode = payload.mode === "meeting" ? "meeting" : "interview";
              const sessionState = realtimeManager.getSession(activeSessionId);
              if (sessionState) {
                sessionState.mode = mode;
              }
              try {
                await db.session.update({
                  where: { id: activeSessionId },
                  data: {
                    mode: mode === "meeting" ? "MEETING" : "INTERVIEW",
                  },
                });
              } catch (dbErr) {
                console.error(
                  "Failed to update mode in DB on updateMode event:",
                  dbErr,
                );
              }
            }

            if (event === REALTIME_EVENTS.session.end && activeSessionId) {
              const pendingTimer = disconnectTimers.get(activeSessionId);
              if (pendingTimer) {
                clearTimeout(pendingTimer);
                disconnectTimers.delete(activeSessionId);
              }

              const durationTimer = durationTimers.get(activeSessionId);
              if (durationTimer) {
                clearTimeout(durationTimer);
                durationTimers.delete(activeSessionId);
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
          const sessionId = activeSessionId;

          const durationTimer = durationTimers.get(sessionId);
          if (durationTimer) {
            clearTimeout(durationTimer);
            durationTimers.delete(sessionId);
          }

          const timer = setTimeout(() => {
            disconnectTimers.delete(sessionId);
            console.log(
              "Grace period expired, cleaning up session:",
              sessionId,
            );
            closeDeepgramSession(sessionId);
            realtimeManager.removeSession(sessionId);
          }, 15000);

          disconnectTimers.set(sessionId, timer);
        }
      });
    },
  );
}
