import {
  buildMessages,
} from "./prompt.js";

import {
  streamAiProvider,
} from "./providers/index.js";

import type {
  ConversationTurn,
} from "./types.js";

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
    startAiStream(
      sessionId,
    );

    await streamAiProvider(

      buildMessages(
        turns,
      ),

      (token) => {
        streamAiToken(
          sessionId,
          token,
        );
      },
    );

    endAiStream(
      sessionId,
    );

  } catch (error) {

    console.error(
      "Error in streamAiResponse:",
      error,
    );

    const message =
      error instanceof Error && error.message
        ? error.message
        : "AI response failed.";

    failAiStream(
      sessionId,
      message,
    );
  }
}
