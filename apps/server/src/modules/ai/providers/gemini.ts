import { GoogleGenAI } from "@google/genai";
import { env } from "../../../config/env.js";

const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

export async function streamGeminiResponse(
  firstArg: string | any[],
  secondArg: string | ((token: string) => void),
  thirdArg?: any[],
  fourthArg?: (token: string) => void,
) {
  try {
    let contents: any[] = [];
    let systemInstruction = "";
    let onToken: (token: string) => void;

    if (Array.isArray(firstArg)) {
      const messages = firstArg;
      onToken = secondArg as (token: string) => void;

      const systemMessages = messages.filter((m) => m.role === "system");
      systemInstruction = systemMessages.map((m) => m.content).join("\n\n");

      contents = messages
        .filter((m) => m.role !== "system")
        .map((m) => {
          const role =
            m.role === "assistant" || m.role === "model" ? "model" : "user";
          return {
            role,
            parts: [
              {
                text: m.content ?? m.text ?? "",
              },
            ],
          };
        });
    } else {
      const sessionId = firstArg;
      const question = secondArg as string;
      const turns = thirdArg ?? [];
      onToken = fourthArg!;

      contents = [
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
    }

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents,
      config: systemInstruction ? { systemInstruction } : undefined,
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