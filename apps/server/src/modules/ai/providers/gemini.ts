import { GoogleGenAI } from "@google/genai";
import { env } from "../../../config/env.js";

const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

// ─────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// This is what stops Gemini from rambling, adding disclaimers, "great
// question!", markdown, etc. The output is read ALOUD by the candidate
// during a live interview, so it must be clean spoken-language only.
// ─────────────────────────────────────────────────────────────────────────
const INTERVIEW_SYSTEM_PROMPT = `You are generating spoken interview answers for a candidate to recite live, word for word, during a real job interview.

STRICT RULES:
- Answer ONLY the question asked. Nothing else.
- Speak in first person, as the candidate ("I would...", "In my experience...", "My approach is...").
- Plain spoken sentences only. NO markdown, NO bullet points, NO headers, NO asterisks, NO numbered lists.
- NO meta-commentary: never say "great question", "happy to help", "as an AI", "I think", "let me explain", or anything that isn't the direct answer itself.
- NO disclaimers, hedging, or caveats about your own knowledge or limitations.
- Target length: 40-110 words — roughly 20-45 seconds of natural speech. Only go longer if the question explicitly asks for deep step-by-step detail.
- If the question is incomplete, ambiguous, or cut off, answer the most likely intended question directly. Never ask for clarification.
- Never break character. You ARE the candidate's voice.

Begin every response as if you are mid-conversation, answering naturally — no preamble, no "Sure," no "Okay,".`;

const MEETING_SYSTEM_PROMPT = `You are generating spoken responses for someone to recite live during a meeting.

STRICT RULES:
- Answer ONLY what was asked or discussed. Nothing else.
- Speak in first person, naturally, as the person in the meeting.
- Plain spoken sentences only. NO markdown, NO bullet points, NO headers, NO asterisks.
- NO meta-commentary, NO disclaimers, NO "as an AI".
- Target length: 30-100 words unless more detail is clearly required.
- Never break character.`;

type ConversationTurn = {
  role: "system" | "user" | "assistant";
  text: string;
  timestamp?: number;
};

type ChatMessage = {
  role: string;
  content?: string;
  text?: string;
};

/**
 * Trims history to keep latency low. Only the last N exchanges are sent —
 * the current question carries far more weight than old context, and a
 * shorter prompt = faster time-to-first-token.
 */
const MAX_HISTORY_TURNS = 4; // last 4 turns (2 Q&A pairs) max

function trimHistory(turns: ConversationTurn[]): ConversationTurn[] {
  const systemTurns = turns.filter((t) => t.role === "system");
  const chatTurns = turns.filter((t) => t.role !== "system");

  const trimmedChat =
    chatTurns.length > MAX_HISTORY_TURNS
      ? chatTurns.slice(-MAX_HISTORY_TURNS)
      : chatTurns;

  // Keep system turns first so they fold cleanly into systemInstruction.
  return [...systemTurns, ...trimmedChat];
}

export async function streamGeminiResponse(
  firstArg: string | ChatMessage[],
  secondArg: string | ((token: string) => void),
  thirdArg?: ConversationTurn[],
  fourthArg?: (token: string) => void,
  mode: "interview" | "meeting" = "interview",
) {
  try {
    let contents: any[] = [];
    let systemInstruction = "";
    let onToken: (token: string) => void;

    if (Array.isArray(firstArg)) {
      // ── Raw-messages signature ──
      const messages = firstArg;
      onToken = secondArg as (token: string) => void;

      const systemMessages = messages.filter((m) => m.role === "system");
      systemInstruction =
        systemMessages.length > 0
          ? systemMessages.map((m) => m.content).join("\n\n")
          : INTERVIEW_SYSTEM_PROMPT;

      contents = messages
        .filter((m) => m.role !== "system")
        .map((m) => {
          const role =
            m.role === "assistant" || m.role === "model" ? "model" : "user";
          return {
            role,
            parts: [{ text: m.content ?? m.text ?? "" }],
          };
        });
    } else {
      // ── (sessionId, question, turns, onToken) signature ──
      const question = secondArg as string;
      const turns = trimHistory(thirdArg ?? []);
      onToken = fourthArg!;

      // ALWAYS apply the interview/meeting system prompt — this was
      // previously empty, causing Gemini to ramble with no constraints.
      const basePrompt =
        mode === "meeting" ? MEETING_SYSTEM_PROMPT : INTERVIEW_SYSTEM_PROMPT;

      // Any turns with role "system" (e.g. screen-context injections) get
      // folded into the system instruction rather than sent as chat turns —
      // Gemini's `contents` array only accepts "user" | "model" roles.
      const systemTurns = turns.filter((t) => t.role === "system");
      const chatTurns = turns.filter((t) => t.role !== "system");

      systemInstruction =
        systemTurns.length > 0
          ? `${basePrompt}\n\n${systemTurns.map((t) => t.text).join("\n\n")}`
          : basePrompt;

      contents = [
        ...chatTurns.map((turn) => ({
          role: turn.role === "assistant" ? "model" : "user",
          parts: [{ text: turn.text ?? "" }],
        })),
        {
          role: "user",
          parts: [{ text: question }],
        },
      ];
    }

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        // CRITICAL for latency: gemini-2.5-flash defaults to "thinking" mode,
        // which adds significant delay before the first token streams out.
        // For interview answers we want speed over deep reasoning.
        thinkingConfig: {
          thinkingBudget: 0,
        },
        // Keep responses tight — backs up the prompt's length instruction
        // and prevents runaway generations from adding extra latency.
        maxOutputTokens: 300,
        temperature: 0.6,
      },
    });

    for await (const chunk of stream) {
      const token = chunk.text;
      if (token) {
        onToken(token);
      }
    }
  } catch (err) {
    console.error("[GEMINI ERROR]", err);
    throw err;
  }
}

// Alias so transcript.ts's import (`streamGeminiReply`) resolves correctly.
export const streamGeminiReply = streamGeminiResponse;