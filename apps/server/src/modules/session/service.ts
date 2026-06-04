import { db } from "../../db/client.js";
import { generateSessionSummary } from "./summary.js";

export async function createSession(
  userId: string,
  mode: "INTERVIEW" | "MEETING",
) {
  try {
    console.log("Creating session for:", userId);

    const session = await db.session.create({
      data: {
        userId,
        mode,
      },
    });

    console.log("Session created:", session.id);

    return session;
  } catch (err) {
    console.error("CREATE SESSION ERROR", err);

    throw err;
  }
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

      analytics: true,

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
      summary: true,
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

      analytics: true,

      summary: true,
    },
  });
}
