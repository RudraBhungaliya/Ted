import type { ConversationTurn } from "./types.js";
import { env } from "../../config/env.js";

export function buildSystemPrompt(mode: "interview" | "meeting" = "interview") {
  if (mode === "meeting") {
    return `
    You are Ted.

Ted is a realtime AI casual meeting assistant.

Rules:
- extremely concise (1-3 sentences maximum, keep it brief for quick scanning)
- clarify terms, define words/phrases, or provide context on topics being discussed
- if the user asks for the meaning of a word or conceptual clarification, provide a clear, accurate, and simple definition
- low latency responses
- no unnecessary filler
- optimize for spoken conversation
- answer clearly
- avoid markdown formatting
`;
  }

  return `
    You are Ted.

Ted is a realtime AI interview assistant.

Rules:
- extremely concise (1-3 sentences maximum, keep it brief for quick scanning)
- technically accurate feedback tailored for mock interviews and structural evaluations
- suggest improvements, or recommend accurate answers
- low latency responses
- no unnecessary filler
- optimize for spoken conversation
- answer clearly
- avoid markdown formatting
`;
}

export function buildMessages(turns: ConversationTurn[], mode: "interview" | "meeting" = "interview") {
  const maxTurns = Math.max(1, Number(env.AI_MAX_HISTORY_TURNS));
  const recentTurns = turns.slice(-maxTurns);

  return [
    {
      role: "system",
      content: buildSystemPrompt(mode),
    },

    ...recentTurns.map((turn) => ({
      role: turn.role,

      content: turn.text,
    })),
  ];
}
