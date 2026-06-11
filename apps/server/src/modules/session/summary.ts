import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env.js";
import { db } from "../../db/client.js";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export async function generateSessionSummary(sessionId: string) {
  let totalWords = 0;
  let fillerCount = 0;
  let confidenceScore = 0;

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
        `No transcripts recorded for session ${sessionId}. Storing default empty summary and analytics.`,
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

      await db.sessionAnalytics.upsert({
        where: {
          sessionId,
        },
        create: {
          sessionId,
          totalWords: 0,
          fillerCount: 0,
          confidenceScore: 0,
          communicationScore: 0,
          technicalScore: 0,
        },
        update: {
          totalWords: 0,
          fillerCount: 0,
          confidenceScore: 0,
          communicationScore: 0,
          technicalScore: 0,
        },
      });
      return;
    }

    // 2. Calculate local metrics from USER transcripts FIRST
    const userTranscripts = session.transcripts.filter((t) => t.speakerType === "USER");
    const concatenatedUserText = userTranscripts.map((t) => t.text).join(" ");
    const words = concatenatedUserText.split(/\s+/).filter(Boolean);
    totalWords = words.length;

    const fillerWords = [
      "um", "uh", "like", "basically", "actually", "you know", "sort of", "kind of"
    ];
    const lower = concatenatedUserText.toLowerCase();
    for (const filler of fillerWords) {
      const matches = lower.match(new RegExp(`\\b${filler}\\b`, "g"));
      fillerCount += matches?.length ?? 0;
    }

    confidenceScore = Math.max(
      0,
      Math.min(100, Math.round(100 - fillerCount * 4 - (totalWords < 20 ? 20 : 0)))
    );

    // 3. Format transcript
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
  "actionItems": ["string"],
  "overallScore": number,
  "communicationScore": number,
  "technicalScore": number
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
  "actionItems": ["string"],
  "overallScore": number,
  "communicationScore": number,
  "technicalScore": number
}

Return ONLY valid JSON.
`;

    // 4. Request JSON from Gemini
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
      overallScore?: number;
      communicationScore?: number;
      technicalScore?: number;
    };

    // 5. Save to PostgreSQL db for summary
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

    const finalTechnicalScore = Number(json.technicalScore ?? json.overallScore ?? 80);
    const finalCommunicationScore = Number(json.communicationScore ?? json.overallScore ?? 80);

    // 6. Save to PostgreSQL db for analytics
    await db.sessionAnalytics.upsert({
      where: {
        sessionId,
      },
      create: {
        sessionId,
        totalWords,
        fillerCount,
        confidenceScore,
        communicationScore: finalCommunicationScore,
        technicalScore: finalTechnicalScore,
      },
      update: {
        totalWords,
        fillerCount,
        confidenceScore,
        communicationScore: finalCommunicationScore,
        technicalScore: finalTechnicalScore,
      },
    });

    console.log(`Generated summary and analytics for session: ${sessionId}`);
  } catch (error) {
    console.error("Failed to generate session summary and analytics:", error);
    // Fallback summary and analytics on failure so we don't crash
    try {
      await db.sessionSummary.upsert({
        where: {
          sessionId,
        },
        create: {
          sessionId,
          overview: `Mock session completed. Total words spoken: ${totalWords}. Filler words count: ${fillerCount}. Confidence rating estimated at ${confidenceScore}%.`,
          keyPoints: ["Detailed speech pacing assessment", `${totalWords} words captured`],
          actionItems: ["Practice reducing filler word frequency", "Aim to increase length of answers to exceed 20 words for structural completeness"],
        },
        update: {
          overview: `Mock session completed. Total words spoken: ${totalWords}. Filler words count: ${fillerCount}. Confidence rating estimated at ${confidenceScore}%.`,
          keyPoints: ["Detailed speech pacing assessment", `${totalWords} words captured`],
          actionItems: ["Practice reducing filler word frequency", "Aim to increase length of answers to exceed 20 words for structural completeness"],
        },
      });
    } catch {}

    try {
      await db.sessionAnalytics.upsert({
        where: {
          sessionId,
        },
        create: {
          sessionId,
          totalWords,
          fillerCount,
          confidenceScore,
          communicationScore: 75,
          technicalScore: 75,
        },
        update: {
          totalWords,
          fillerCount,
          confidenceScore,
          communicationScore: 75,
          technicalScore: 75,
        },
      });
    } catch {}
  }
}
