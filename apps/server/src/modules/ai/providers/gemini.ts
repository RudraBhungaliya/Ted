import {
  GoogleGenerativeAI,
} from "@google/generative-ai";

import { env } from "../../../config/env.js";

import type {
  StreamTokenHandler,
} from "../types.js";

const genAI =
  new GoogleGenerativeAI(
    env.GEMINI_API_KEY,
  );

const model =
  genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

export async function streamGeminiResponse(
  messages: any[],
  onToken: StreamTokenHandler,
) {

  const prompt =
    messages
      .map(
        (m) =>
          `${m.role}: ${m.content}`,
      )
      .join("\n");

  console.log(
    "PROMPT:",
    prompt,
  );

  const result =
    await model.generateContentStream(
      prompt,
    );

  for await (
    const chunk
    of result.stream
  ) {

    const text =
      chunk.text();

    if (!text)
      continue;

    console.log(
      "TOKEN:",
      text,
    );

    onToken(
      text,
    );
  }
}