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
} from "../realtime/stream.js";

export async function streamAiResponse(
  sessionId: string,
  turns: ConversationTurn[],
) {

  try {

    console.log(
      "AI RESPONSE START",
    );

    startAiStream(
      sessionId,
    );

    await streamAiProvider(

      buildMessages(
        turns,
      ),

      (token) => {

        console.log(
          "TOKEN:",
          token,
        );

        streamAiToken(
          sessionId,
          token,
        );
      },
    );

    console.log(
      "AI RESPONSE END",
    );

    endAiStream(
      sessionId,
    );

  } catch (error) {

    console.error(
      "Error in streamAiResponse:",
      error,
    );
  }
}