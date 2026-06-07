import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env.js";
import { db } from "../../db/client.js";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export async function generateSessionSummary(sessionId: string) {
  try {
    // 1. Fetch transcripts and AI messages
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        transcripts: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!session) {
      console.warn(`Session ${sessionId} not found for summary generation.`);
      return;
    }

    if (session.transcripts.length === 0) {
      console.log(
        `No transcripts recorded for session ${sessionId}. Storing default empty summary.`,
      );
      await db.sessionSummary.upsert({
        where: {
          sessionId,
        },

        create: {
          sessionId,

          overview: "No conversation recorded.",

          keyPoints: [],

          actionItems: [],
        },

        update: {
          overview: "No conversation recorded.",

          keyPoints: [],

          actionItems: [],
        },
      });
      return;
    }

    // 2. Format transcript
    const historyText = session.transcripts
      .map((t) => `${t.speakerName}: ${t.text}`)
      .join("\n");

    const isMeeting = session.mode === "MEETING";
    const prompt = isMeeting
      ? `
You are an expert executive assistant and meeting coordinator. You will analyze the conversation transcripts and the AI assistant responses from a casual meeting/discussion session.

Analyze the meeting's progression, clarity of discussion, and key terms clarified to generate a meeting evaluation summary.

Meeting Transcript & Assistant Response History:
${historyText}

Evaluate:
1. Overall meeting score (0 to 100 based on coordination, clarity, task alignment, and communication).
2. Key strengths / positive takeaways (3-5 items, e.g. clear explanations, good queries, productive flow).
3. Areas of weakness or missed items (3-5 items, e.g. undefined acronyms, circular discussions, unresolved questions).
4. Detailed recommendations:
   - Key topics and terms defined/clarified during the session.
   - Specific action items and follow-ups.
   - Suggested next steps for better alignment.

Provide the response in the following JSON format:
{
  "overview": "string",
  "keyPoints": ["string"],
  "actionItems": ["string"]
}

Return ONLY valid JSON.
`
      : `
You are an expert technical interview coach. You will analyze the conversation transcripts and the AI copilot responses from a mock interview session.

Analyze the user's performance and answer quality to generate an evaluation summary.

Mock Interview Transcript & Feedback History:
${historyText}

Evaluate:
1. Overall interview score (0 to 100 based on standard tech interview rubrics, communication, and correctness).
2. Key strengths (3-5 items, keep them concise and specific).
3. Areas of weakness or improvement (3-5 items).
4. Detailed recommendations:
   - STAR compliance analysis (Situation, Task, Action, Result check on their responses).
   - Specific recommended answers or structuring for their weak areas.
   - Core action items they should execute next.

Provide the response in the following JSON format:
{
  "overview": "string",
  "keyPoints": ["string"],
  "actionItems": ["string"]
}

Return ONLY valid JSON.
`;

    // 3. Request JSON from Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const contentText = response.text;
    if (!contentText) {
      throw new Error(
        "Received empty response from Gemini API for summary generation.",
      );
    }

    const json = JSON.parse(contentText) as {
      overview: string;
      keyPoints: string[];
      actionItems: string[];
    };

    // 4. Save to PostgreSQL db
    await db.sessionSummary.upsert({
      where: {
        sessionId,
      },

      create: {
        sessionId,

        overview: json.overview ?? "No overview generated.",

        keyPoints: json.keyPoints ?? [],

        actionItems: json.actionItems ?? [],
      },

      update: {
        overview: json.overview ?? "No overview generated.",

        keyPoints: json.keyPoints ?? [],

        actionItems: json.actionItems ?? [],
      },
    });

    console.log(`Generated summary for session: ${sessionId}`);
  } catch (error) {
    console.error("Failed to generate session summary:", error);
    // Fallback summary on failure so we don't crash
    try {
      await db.sessionSummary.upsert({
        where: {
          sessionId,
        },

        create: {
          sessionId,

          overview: "Summary generation failed.",

          keyPoints: [],

          actionItems: [],
        },

        update: {
          overview: "Summary generation failed.",

          keyPoints: [],

          actionItems: [],
        },
      });
    } catch {}
  }
}
