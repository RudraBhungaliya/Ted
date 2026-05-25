import { db } from "../../db/client.js";

export async function getSessionById(sessionId: string) {
  return await db.session.findUnique({
    where: {
      id: sessionId,
    },

    include: {
      transcripts: {
        orderBy: {
          createdAt: "asc",
        },
      },

      aiMessages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

export async function getUserSessions(userId: string) {
  return await db.session.findMany({
    where: {
      userId,
    },
    orderBy: {
      startedAt: "desc",
    },
    include: {
      transcripts: {
        orderBy: {
          createdAt: "asc",
        },
      },

      aiMessages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}
