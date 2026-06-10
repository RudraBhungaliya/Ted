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
  const existing = await db.session.findUnique({
    where: {
      id: sessionId,
    },
  });

  const now = new Date();

  const session = await db.session.update({
    where: {
      id: sessionId,
    },
    data: {
      endedAt: now,
      status: "COMPLETED",
      durationSeconds: existing
        ? Math.floor((now.getTime() - existing.startedAt.getTime()) / 1000)
        : null,
    },
  });

  // Generate session summary asynchronously
  void generateSessionSummary(sessionId);

  return session;
}

export async function getSessionById(sessionId: string) {
  const session = await db.session.findUnique({
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

  if (!session) return null;

  // 1. Map human/system speaker transcripts to a standard format
  const spokenTurns = (session.transcripts || [])
    .filter((t: any) => t.speakerType !== "AI")
    .map((t: any) => ({
      id: t.id,
      role:
        t.speakerType === "USER"
          ? "user"
          : t.speakerType === "PARTICIPANT"
            ? "interviewer"
            : "participant",
      speakerName:
        t.speakerName ||
        (t.speakerType === "USER"
          ? "You"
          : t.speakerType === "PARTICIPANT"
            ? "Interviewer"
            : "Participant"),
      text: t.text,
      timestamp: new Date(t.createdAt).getTime(),
    }));

  // 2. Map generated AI messages to the same structure
  const aiTurns = (session.aiMessages || []).map((m: any) => ({
    id: m.id,
    role: "ai",
    speakerName: "TED (AI)",
    text: m.text,
    timestamp: new Date(m.createdAt).getTime(),
  }));

  // 3. Interleave and sort strictly by historical timeline order
  const timeline = [...spokenTurns, ...aiTurns].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  // Return the session object decorated with our interleaved timeline array
  return {
    ...session,
    timeline,
  };
}

export async function getUserSessions(
  userId: string,
) {
  console.log("Fetching all session records for User ID =", userId);

  // Fetches EVERY session from the database, newest records at the top
  const sessions = await db.session.findMany({
    where: {
      userId: userId, // Ensure you filter by the user's active id context
    },
    include: {
      summary: true,
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  return sessions;
}

export async function getActiveSessionByUserId(userId: string) {
  const session = await db.session.findFirst({
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

  if (!session) return null;

  // Mirror the timeline logic for active/resumed sessions to keep structures identical
  const spokenTurns = (session.transcripts || [])
    .filter((t: any) => t.speakerType !== "AI")
    .map((t: any) => ({
      id: t.id,
      role:
        t.speakerType === "USER"
          ? "user"
          : t.speakerType === "PARTICIPANT"
            ? "interviewer"
            : "participant",
      speakerName:
        t.speakerName ||
        (t.speakerType === "USER"
          ? "You"
          : t.speakerType === "PARTICIPANT"
            ? "Interviewer"
            : "Participant"),
      text: t.text,
      timestamp: new Date(t.createdAt).getTime(),
    }));

  const aiTurns = (session.aiMessages || []).map((m: any) => ({
    id: m.id,
    role: "ai",
    speakerName: "TED (AI)",
    text: m.text,
    timestamp: new Date(m.createdAt).getTime(),
  }));

  const timeline = [...spokenTurns, ...aiTurns].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  return {
    ...session,
    timeline,
  };
}