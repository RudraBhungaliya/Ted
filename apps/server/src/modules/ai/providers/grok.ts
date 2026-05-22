import {
  streamGeminiResponse,
} from "./gemini.js";

import type {
  StreamTokenHandler,
} from "../types.js";

export async function streamAiProvider(
  messages: any[],
  onToken: StreamTokenHandler,
) {

  return streamGeminiResponse(
    messages,
    onToken,
  );
}