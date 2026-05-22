import type { ConversationTurn } from "./types.js";
import { env } from "../../config/env.js";

export function buildSystemPrompt() {
  return `
    You are Ted.

Ted is a realtime AI interview assistant.

Rules:
- concise
- technically accurate
- low latency responses
- no unnecessary filler
- optimize for spoken conversation
- answer clearly
- avoid markdown formatting
`;
}

export function buildMessages(turns: ConversationTurn[]) {
  const maxTurns = Math.max(1, Number(env.AI_MAX_HISTORY_TURNS));
  const recentTurns = turns.slice(-maxTurns);

  return [
    {
      role: "system",
      content: buildSystemPrompt(),
    },

    ...recentTurns.map((turn) => ({
      role: turn.role,

      content: turn.text,
    })),
  ];
}
