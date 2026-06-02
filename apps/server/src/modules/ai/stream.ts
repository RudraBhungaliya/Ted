import { buildMessages } from "./prompt.js";

import { streamAiProvider } from "./providers/index.js";

import type { ConversationTurn } from "./types.js";

import { db } from "../../db/client.js";
import { realtimeManager } from "../realtime/manager.js";

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
    const sessionState = realtimeManager.getSession(sessionId);
    const mode = sessionState?.mode ?? "interview";

    startAiStream(sessionId);

    let fullResponse = "";
    let receivedTokens = false;

    const streamPromise = streamAiProvider(
      buildMessages(turns, mode),

      (token) => {
        receivedTokens = true;
        fullResponse += token;

        streamAiToken(sessionId, token);
      },
    );

    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        if (!receivedTokens) {
          reject(new Error("AI response timed out. Please try again."));
        }
      }, 12000);
    });

    await Promise.race([streamPromise, timeoutPromise]);

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
