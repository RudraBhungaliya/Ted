import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../../middleware/auth.js";
import {
  createSessionController,
  endSessionController,
  getSessionController,
  getUserSessionsController,
  getActiveSessionController,
} from "./controller.js";

export async function sessionRoutes(app: FastifyInstance) {
  // 1. POST: /api/session/create
  app.post(
    "/create",
    {
      preHandler: authMiddleware,
    },
    async (request) => {
      const { mode } = request.body as {
        mode: "INTERVIEW" | "MEETING";
      };

      const session = await createSessionController(request.user!.userId, mode);

      return {
        success: true,
        session,
      };
    },
  );

  // 2. POST: /api/session/end/:sessionId
  app.post(
    "/end/:sessionId",
    {
      preHandler: authMiddleware,
    },
    async (request) => {
      const { sessionId } = request.params as {
        sessionId: string;
      };

      await endSessionController(sessionId);

      return {
        success: true,
      };
    },
  );

  // 3. GET: /api/session/active
  app.get(
    "/active",
    {
      preHandler: authMiddleware,
    },
    async (request) => {
      const session = await getActiveSessionController(request.user!.userId);

      return {
        success: true,
        session,
      };
    },
  );

  // 4. GET: /api/session/user/all
  // CRITICAL FIX: Registered BEFORE parameterized routes so "user" isn't hijacked as an ID variable
  app.get(
    "/user/all",
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      try {
        console.log("USER SYSTEM REGISTRY CONTEXT:", request.user);

        const sessions = await getUserSessionsController(request.user!.userId);

        return {
          success: true,
          sessions,
        };
      } catch (err) {
        console.error("GET USER SESSIONS ERROR:", err);

        return reply.status(500).send({
          success: false,
          error: String(err),
        });
      }
    },
  );

  // 5. GET: /api/session/:sessionId
  app.get(
    "/:sessionId",
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      const { sessionId } = request.params as {
        sessionId: string;
      };

      const session = await getSessionController(sessionId);

      if (!session) {
        return reply.status(404).send({
          success: false,
          message: "Session not found",
        });
      }

      if (session.userId !== request.user!.userId) {
        return reply.status(403).send({
          success: false,
          message: "Forbidden",
        });
      }

      return {
        success: true,
        session,
      };
    },
  );
}