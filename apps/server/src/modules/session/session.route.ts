import type { FastifyInstance } from "fastify";

import { endSession } from "./service.js";

import { authMiddleware } from "../../middleware/auth.js";

import { createSession } from "./service.js";

import { getSessionById, getUserSessions } from "./controller.js";

export async function sessionRoutes(app: FastifyInstance) {
  app.post(
    "/create",

    {
      preHandler: authMiddleware,
    },

    async (request) => {
      const session = await createSession(request.user!.userId);

      return {
        success: true,

        session,
      };
    },
  );

  app.post(
    "/end/:sessionId",
    {
      preHandler: authMiddleware,
    },

    async (request) => {
      const { sessionId } = request.params as {
        sessionId: string;
      };

      await endSession(sessionId);

      return {
        success: true,
      };
    },
  );

  app.get(
    "/:sessionId",
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      const { sessionId } = request.params as {
        sessionId: string;
      };

      const session = await getSessionById(sessionId);

      if (!session) {
        return reply.status(404).send({
          success: false,
          message: "Session not found",
        });
      }

      return {
        success: true,
        session,
      };
    },
  );

  app.get(
    "user/all",
    {
      preHandler: authMiddleware,
    },
    async (request) => {
      const sessions = await getUserSessions(request.user!.userId);

      return {
        success: true,
        sessions,
      };
    },
  );
}
