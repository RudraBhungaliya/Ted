import type { FastifyInstance } from "fastify";

import { authMiddleware } from "../../middleware/auth.js";
import { analyzeScreenFrame } from "./service.js";

export async function screenRoutes(app: FastifyInstance) {
  app.post(
    "/analyze",
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      const body = request.body as {
        sessionId?: string;
        transcript?: string;
        image?: string;
      };

      if (!body?.sessionId || !body?.image) {
        return reply.status(400).send({
          success: false,
          message: "sessionId and image are required.",
        });
      }

      const analysis = await analyzeScreenFrame({
        sessionId: body.sessionId,
        transcript: body.transcript ?? "",
        image: body.image,
      });

      return {
        success: true,
        analysis,
      };
    },
  );
}