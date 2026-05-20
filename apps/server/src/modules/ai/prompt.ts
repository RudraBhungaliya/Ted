import type { ConversationTurn } from "./types.js";

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
  return [
    {
      role: "system",
      content: buildSystemPrompt(),
    },

    ...turns.map((turn) => ({
      role: turn.role,

      content: turn.text,
    })),
  ];
}
