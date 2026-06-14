import { db } from "../../db/client.js";
import { generateSessionSummary } from "./summary.js";

type SessionWithChat = Awaited<ReturnType<typeof db.session.findUnique>> & {
  transcripts?: any[];
  aiMessages?: any[];
};

type TimelineTurn = {
  id: string;
  role: "user" | "interviewer" | "participant" | "ai";
  speakerName: string;
  text: string;
  timestamp: number;
};

const SAME_SPEAKER_MERGE_WINDOW_MS = 30_000;

function normalizeWords(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function combineTranscriptText(previous: string, next: string) {
  const left = previous.trim();
  const right = next.trim();

  if (!left) return right;
  if (!right) return left;
  if (right.startsWith(left)) return right;
  if (left.startsWith(right)) return left;

  const leftWords = normalizeWords(left);
  const rightWords = normalizeWords(right);
  const normalizedLeft = leftWords.join(" ");
  const normalizedRight = rightWords.join(" ");

  if (normalizedRight.startsWith(normalizedLeft)) {
    return right;
  }

  if (normalizedLeft.startsWith(normalizedRight)) {
    return left;
  }

  const maxOverlap = Math.min(leftWords.length, rightWords.length);
  for (let size = maxOverlap; size > 0; size -= 1) {
    const leftSuffix = leftWords.slice(-size).join(" ");
    const rightPrefix = rightWords.slice(0, size).join(" ");

    if (leftSuffix === rightPrefix) {
      return `${left} ${rightWords.slice(size).join(" ")}`.trim();
    }
  }

  return `${left} ${right}`.trim();
}

function mergeAdjacentTurns(turns: TimelineTurn[]) {
  return turns.reduce<TimelineTurn[]>((merged, turn) => {
    const previous = merged[merged.length - 1];

    if (
      previous &&
      previous.role === turn.role &&
      previous.speakerName === turn.speakerName &&
      turn.timestamp - previous.timestamp <= SAME_SPEAKER_MERGE_WINDOW_MS
    ) {
      previous.id = `${previous.id}:${turn.id}`;
      previous.text = combineTranscriptText(previous.text, turn.text);
      return merged;
    }

    merged.push({ ...turn });
    return merged;
  }, []);
}

function mapSessionTimeline(session: SessionWithChat) {
  const spokenTurns = (session?.transcripts || [])
    .filter((t: any) => t.speakerType !== "AI")
    .map((t: any) => ({
      id: t.id,
      role: (t.speakerType === "USER"
        ? "user"
        : t.speakerType === "PARTICIPANT"
          ? "interviewer"
          : "participant") as TimelineTurn["role"],
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

  const aiTurns = (session?.aiMessages || []).map((m: any) => ({
    id: m.id,
    role: "ai" as const,
    speakerName: "TED (AI)",
    text: m.text,
    timestamp: new Date(m.createdAt).getTime(),
  }));

  const legacyAiTranscriptTurns = (session?.transcripts || [])
    .filter((t: any) => t.speakerType === "AI")
    .filter((t: any) => {
      const transcriptTime = new Date(t.createdAt).getTime();

      return !(session?.aiMessages || []).some((m: any) => {
        const messageTime = new Date(m.createdAt).getTime();
        return (
          m.text.trim() === t.text.trim() &&
          Math.abs(messageTime - transcriptTime) < 5000
        );
      });
    })
    .map((t: any) => ({
      id: t.id,
      role: "ai" as const,
      speakerName: t.speakerName || "TED (AI)",
      text: t.text,
      timestamp: new Date(t.createdAt).getTime(),
    }));

  const orderedTurns = [...spokenTurns, ...aiTurns, ...legacyAiTranscriptTurns].sort(
    (a, b) => a.timestamp - b.timestamp,
  );

  return mergeAdjacentTurns(orderedTurns);
}

import { billingRepository } from "../billing/billing.repository.js";
import { SESSION_LIMITS } from "../../config/constants.js";
import { BadRequestError } from "../../utils/error.js";

export async function createSession(
  userId: string,
  mode: "INTERVIEW" | "MEETING",
) {
  try {
    console.log("Creating session for:", userId);

    const isPremium = await billingRepository.hasActiveSubscription(userId);
    const maxSessions = isPremium
      ? SESSION_LIMITS.PREMIUM.MAX_SESSIONS
      : SESSION_LIMITS.FREE.MAX_SESSIONS;

    const sessionCount = await db.session.count({
      where: {
        userId,
        status: "COMPLETED",
      },
    });

    if (sessionCount >= maxSessions) {
      throw new BadRequestError(
        `Session limit reached. You have created ${sessionCount} of ${maxSessions} allowed sessions. Please upgrade your plan.`
      );
    }

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

  return {
    ...session,
    timeline: mapSessionTimeline(session),
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
      analytics: true,
      _count: {
        select: {
          transcripts: true,
          aiMessages: true,
        },
      },
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

  return {
    ...session,
    timeline: mapSessionTimeline(session),
  };
}
