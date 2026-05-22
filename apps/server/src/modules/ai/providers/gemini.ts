import { GoogleGenAI } from "@google/genai";
import type { StreamTokenHandler } from "../types.js";
// Import your parsed env object from your schema path
import { env } from "../../../config/env.js";

// Explicitly pass the key so there is zero guesswork for the SDK
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export async function streamGeminiResponse(
  messages: any[],
  onToken: StreamTokenHandler,
) {
  try {
    // Format incoming generic chat history format into Gemini content blocks
    const formattedMessages = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content || msg.text || "" }]
    }));

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: formattedMessages,
    });

    for await (const chunk of responseStream) {
      const token = chunk.text;
      if (token) {
        onToken(token);
      }
    }
  } catch (error) {
    console.error("Gemini Engine Stream Error:", error);
    throw error;
  }
}