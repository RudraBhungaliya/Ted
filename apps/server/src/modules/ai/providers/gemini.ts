import { GoogleGenAI } from "@google/genai";
import { env } from "../../../config/env.js";

const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

export async function streamGeminiResponse(
  sessionId: string,
  question: string,
  turns: any[],
  onToken: (token: string) => void,
) {
  try {
    const messages = [
      ...turns.map((turn) => ({
        role: turn.role === "assistant" ? "model" : "user",
        parts: [
          {
            text: turn.text ?? "",
          },
        ],
      })),
      {
        role: "user",
        parts: [
          {
            text: question,
          },
        ],
      },
    ];

    const stream =
      await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: messages,
      });

    for await (const chunk of stream) {
      const token = chunk.text;

      if (token) {
        onToken(token);
      }
    }
  } catch (err) {
    console.error(
      "[GEMINI ERROR]",
      err,
    );

    throw err;
  }
}