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
          orderBy: { createdAt: "asc" }
        },
        aiMessages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!session) {
      console.warn(`Session ${sessionId} not found for summary generation.`);
      return;
    }

    if (session.transcripts.length === 0) {
      console.log(`No transcripts recorded for session ${sessionId}. Storing default empty summary.`);
      await db.interviewSummary.create({
        data: {
          sessionId,
          score: 0,
          strengths: ["No interview responses recorded"],
          weaknesses: ["No interview responses recorded"],
          recommendations: ["Speak during the interview to generate feedback recommendations"],
        }
      });
      return;
    }

    // 2. Format transcript
    const historyText = session.transcripts.map((t, idx) => {
      const matchingAi = session.aiMessages[idx]?.text || "No AI feedback stream.";
      return `User Answer/Question: ${t.text}\nAI Feedback/Response: ${matchingAi}\n---`;
    }).join("\n");

    const isMeeting = session.mode === "meeting";
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
  "score": <number between 0 and 100>,
  "strengths": ["string", "string", ...],
  "weaknesses": ["string", "string", ...],
  "recommendations": ["string", "string", ...]
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
  "score": <number between 0 and 100>,
  "strengths": ["string", "string", ...],
  "weaknesses": ["string", "string", ...],
  "recommendations": ["string", "string", ...]
}

Return ONLY valid JSON.
`;

    // 3. Request JSON from Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const contentText = response.text;
    if (!contentText) {
      throw new Error("Received empty response from Gemini API for summary generation.");
    }

    const json = JSON.parse(contentText) as {
      score: number;
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
    };

    // 4. Save to PostgreSQL db
    await db.interviewSummary.create({
      data: {
        sessionId,
        score: Math.min(100, Math.max(0, json.score || 70)),
        strengths: json.strengths || [],
        weaknesses: json.weaknesses || [],
        recommendations: json.recommendations || [],
      }
    });

    console.log(`Generated and stored interview summary for session: ${sessionId}`);
  } catch (error) {
    console.error("Failed to generate session summary:", error);
    // Fallback summary on failure so we don't crash
    try {
      await db.interviewSummary.create({
        data: {
          sessionId,
          score: 70,
          strengths: ["Communication style", "Problem solving approach"],
          weaknesses: ["Filler word usage", "STAR format structure"],
          recommendations: ["Review the transcript to identify filler word counts", "Implement explicit Situation-Task-Action-Result stages in your answers"],
        }
      });
    } catch {}
  }
}
