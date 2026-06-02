import { db } from "../../db/client.js";
import { generateSessionSummary } from "./summary.js";

export async function createSession(userId: string) {
  return await db.session.create({
    data: {
      userId,
    },
  });
}

export async function endSession(sessionId: string) {
  const session = await db.session.update({
    where: {
      id: sessionId,
    },
    data: {
      endedAt: new Date(),
      status: "COMPLETED",
    },
  });

  // Generate session summary asynchronously
  void generateSessionSummary(sessionId);

  return session;
}

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

      analytics: {
        orderBy: {
          createdAt: "desc",
        },
      },

      summary: true,
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

export async function getActiveSessionByUserId(userId: string) {
  return await db.session.findFirst({
    where: {
      userId,
      status: "ACTIVE",
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
      analytics: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

