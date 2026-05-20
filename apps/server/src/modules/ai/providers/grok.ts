import OpenAi from "openai";

import { env } from "../../../config/env.js";

import { StreamTokenHandler } from "../types.js";

const grok = new OpenAi({
  apiKey: env.XAI_API_KEY,
  baseURL: env.XAI_API_BASE_URL,
});

export async function streamGrokResponse(
  messages: any[],
  onToken: StreamTokenHandler,
) {
  const stream = await grok.chat.completions.create({
    model: "grok-3-mini",
    stream: true,
    temperature: 0.7,
    messages,
  });

  for await (const part of stream) {
    const token = part.choices[0].delta.content;

    if (!token) continue;

    onToken(token);
  }
}
