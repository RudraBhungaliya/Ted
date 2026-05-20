import { buildMessages } from "./prompt.js";

import { streamGrokResponse } from "./providers/grok.js";

import type { ConversationTurn } from "./types.js";

import {
  startAiStream,
  streamAiToken,
  endAiStream,
} from "../realtime/stream.js";

export async function streamAiResponse(
  sessionId: string,
  turns: ConversationTurn[],
) {
  try {
    startAiStream(sessionId);

    await streamGrokResponse(
      buildMessages(turns),

      (token) => {
        streamAiToken(sessionId, token);
      },
    );

    endAiStream(sessionId);
  } catch (error) {
    console.error("Error in streamAiResponse : ", error);
  }
}
