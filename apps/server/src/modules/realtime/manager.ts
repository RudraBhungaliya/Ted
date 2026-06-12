import { WebSocket } from "ws";
import { SessionState } from "./types.js";
import type { ConversationTurn } from "../ai/types.js";
import { db } from "../../db/client.js";

const SAME_ROLE_MERGE_WINDOW_MS = 30_000;

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

  if (normalizedRight.startsWith(normalizedLeft)) return right;
  if (normalizedLeft.startsWith(normalizedRight)) return left;

  const maxOverlap = Math.min(leftWords.length, rightWords.length);
  for (let size = maxOverlap; size > 0; size -= 1) {
    if (
      leftWords.slice(-size).join(" ") ===
      rightWords.slice(0, size).join(" ")
    ) {
      return `${left} ${rightWords.slice(size).join(" ")}`.trim();
    }
  }

  return `${left} ${right}`.trim();
}

function addConversationTurn(turns: ConversationTurn[], turn: ConversationTurn) {
  const previous = turns[turns.length - 1];

  if (
    previous &&
    previous.role === turn.role &&
    turn.timestamp - previous.timestamp <= SAME_ROLE_MERGE_WINDOW_MS
  ) {
    previous.text = combineTranscriptText(previous.text, turn.text);
    previous.timestamp = turn.timestamp;
    return;
  }

  turns.push(turn);
}

function mergeConversationTurns(turns: ConversationTurn[]) {
  return turns.reduce<ConversationTurn[]>((merged, turn) => {
    addConversationTurn(merged, { ...turn });
    return merged;
  }, []);
}

class RealtimeManager {
  private sessions = new Map<string, SessionState>();

  private sockets = new Map<string, WebSocket>();

  createSession(
    sessionId: string,
    mode: "interview" | "meeting" = "interview",
  ) {
    this.sessions.set(sessionId, {
      sessionId,
      turns: [],
      currentAiTokens: [],
      pendingUserText: "",
      aiStreaming: false,
      connected: true,
      mode,
      screenContext: "",
    });
  }

  async restoreSession(
    sessionId: string,
    defaultMode: "interview" | "meeting" = "interview",
  ): Promise<boolean> {
    if (this.sessions.has(sessionId)) {
      return true;
    }

    const session = await db.session.findUnique({
      where: { id: sessionId },
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

    if (!session) return false;

    const interviewerTurns: ConversationTurn[] = session.transcripts
      .filter((t) => t.speakerType === "PARTICIPANT")
      .map((t) => ({
        role: "user",
        text: t.text,
        timestamp: t.createdAt.getTime(),
      }));

    const aiTurns: ConversationTurn[] = session.aiMessages.map((m) => ({
      role: "assistant",
      text: m.text,
      timestamp: m.createdAt.getTime(),
    }));

    const legacyAiTranscriptTurns: ConversationTurn[] = session.transcripts
      .filter((t) => t.speakerType === "AI")
      .filter((t) => {
        return !session.aiMessages.some((m) => {
          return (
            m.text.trim() === t.text.trim() &&
            Math.abs(m.createdAt.getTime() - t.createdAt.getTime()) < 5000
          );
        });
      })
      .map((t) => ({
        role: "assistant",
        text: t.text,
        timestamp: t.createdAt.getTime(),
      }));

    const turns = mergeConversationTurns(
      [...interviewerTurns, ...aiTurns, ...legacyAiTranscriptTurns].sort(
        (a, b) => a.timestamp - b.timestamp,
      ),
    );
    const mode = session.mode === "MEETING" ? "meeting" : "interview";

    this.sessions.set(sessionId, {
      sessionId,
      turns,
      currentAiTokens: [],
      pendingUserText: "",
      aiStreaming: false,
      connected: true,
      mode,
      screenContext: "",
    });

    return true;
  }

  appendFinalSegment(sessionId: string, text: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.pendingUserText = combineTranscriptText(
      session.pendingUserText,
      text,
    );
  }

  commitUserTurn(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session || !session.pendingUserText.trim()) {
      return "";
    }

    const text = session.pendingUserText.trim();
    addConversationTurn(session.turns, {
      role: "user",
      text,
      timestamp: Date.now(),
    });
    session.pendingUserText = "";
    return text;
  }

  getLatestUserTurn(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return "";

    if (session.pendingUserText.trim()) {
      return session.pendingUserText;
    }

    const userTurns = session.turns.filter((turn) => turn.role === "user");
    return userTurns[userTurns.length - 1]?.text ?? "";
  }

  setAiStreaming(sessionId: string, streaming: boolean) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.aiStreaming = streaming;
  }

  isAiStreaming(sessionId: string): boolean {
    return this.sessions.get(sessionId)?.aiStreaming ?? false;
  }

  removeSession(sessionId: string) {
    this.sessions.delete(sessionId);
    this.sockets.delete(sessionId);
  }

  getSession(sessionId: string) {
    return this.sessions.get(sessionId);
  }

  setScreenContext(sessionId: string, screenContext: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.screenContext = screenContext;
  }

  getScreenContext(sessionId: string) {
    return this.sessions.get(sessionId)?.screenContext ?? "";
  }

  attachSocket(sessionId: string, socket: WebSocket) {
    this.sockets.set(sessionId, socket);
  }

  getSocket(sessionId: string) {
    return this.sockets.get(sessionId);
  }

  appendUserTurn(sessionId: string, text: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    addConversationTurn(session.turns, {
      role: "user",
      text: text.trim(),
      timestamp: Date.now(),
    });
  }

  appendAiToken(sessionId: string, token: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.currentAiTokens.push(token);
  }

  finalizeAiTurn(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return "";

    const fullResponse = session.currentAiTokens.join("");
    if (fullResponse.trim()) {
      addConversationTurn(session.turns, {
        role: "assistant",
        text: fullResponse.trim(),
        timestamp: Date.now(),
      });
    }
    session.currentAiTokens = [];
    return fullResponse;
  }

  getTurns(sessionId: string): ConversationTurn[] {
    const session = this.sessions.get(sessionId);
    return session ? session.turns : [];
  }

  getFullTranscript(sessionId: string) {
    const session = this.sessions.get(sessionId);

    if (!session) return "";

    return session.turns
      .filter((t) => t.role === "user")
      .map((t) => t.text)
      .join(" ");
  }

  getFullAiResponse(sessionId: string) {
    const session = this.sessions.get(sessionId);

    if (!session) return "";

    return session.turns
      .filter((t) => t.role === "assistant")
      .map((t) => t.text)
      .join(" ");
  }
}

export const realtimeManager = new RealtimeManager();
