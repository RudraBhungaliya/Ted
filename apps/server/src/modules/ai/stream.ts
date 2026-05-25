import { buildMessages } from "./prompt.js";

import { streamAiProvider } from "./providers/index.js";

import type { ConversationTurn } from "./types.js";

import { db } from "../../db/client.js";

import {
  startAiStream,
  streamAiToken,
  endAiStream,
  failAiStream,
} from "../realtime/stream.js";

export async function streamAiResponse(
  sessionId: string,
  turns: ConversationTurn[],
) {
  try {
    startAiStream(sessionId);

    let fullResponse = "";

    await streamAiProvider(
      buildMessages(turns),

      (token) => {
        fullResponse += token;

        streamAiToken(sessionId, token);
      },
    );

    await db.aiMessage.create({
      data: {
        sessionId,

        text: fullResponse,
      },
    });

    endAiStream(sessionId);
  } catch (error) {
    console.error("Error in streamAiResponse:", error);

    const message =
      error instanceof Error && error.message
        ? error.message
        : "AI response failed.";

    failAiStream(sessionId, message);
  }
}
