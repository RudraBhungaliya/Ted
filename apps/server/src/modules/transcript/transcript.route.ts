import type { FastifyInstance } from "fastify";

import { authMiddleware } from "../../middleware/auth.js";

import { getTranscript } from "./service.js";

export async function transcriptRoute(app: FastifyInstance) {
  app.get(
    "/:sessionId",
    {
      preHandler: authMiddleware,
    },

    async (req) => {
      const { sessionId } = req.params as {
        sessionId: string;
      };

      const transcript = await getTranscript(sessionId);
      return {
        success: true,
        data: transcript,
      };
    },
  );
}
