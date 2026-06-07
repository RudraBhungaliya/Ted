import { GoogleGenAI } from "@google/genai";

import { env } from "../../config/env.js";
import { realtimeManager } from "../realtime/manager.js";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

type ScreenAnalysisInput = {
  sessionId: string;
  transcript: string;
  image: string;
};

type ScreenAnalysisResult = {
  analysis: string;
  headline: string;
  suggestedAction: string;
};

function parseDataUrl(image: string) {
  const match = image.match(/^data:(.+);base64,(.+)$/);

  if (match) {
    return {
      mimeType: match[1],
      data: match[2],
    };
  }

  return {
    mimeType: "image/jpeg",
    data: image,
  };
}

export async function analyzeScreenFrame(input: ScreenAnalysisInput) {
  const { mimeType, data } = parseDataUrl(input.image);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are Ted's screen assistant.

Analyze the screenshot and transcript together. Be concise, practical, and specific.

Transcript:
${input.transcript.trim() || "No transcript yet."}

Return valid JSON with these keys:
{
  "headline": "short label for what is on screen",
  "analysis": "2-4 concise sentences describing the visible state, likely task, and any notable issue or opportunity",
  "suggestedAction": "one immediate next step for the user"
}
`,
          },
          {
            inlineData: {
              mimeType,
              data,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const contentText = response.text;

  if (!contentText) {
    throw new Error("Received empty response from Gemini for screen analysis.");
  }

  const result = JSON.parse(contentText) as ScreenAnalysisResult;

  const screenContext = [
    result.headline?.trim() ? `Headline: ${result.headline.trim()}` : "",
    result.analysis?.trim() ? `Analysis: ${result.analysis.trim()}` : "",
    result.suggestedAction?.trim()
      ? `Suggested action: ${result.suggestedAction.trim()}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  if (screenContext.trim()) {
    realtimeManager.setScreenContext(input.sessionId, screenContext);
  }

  return result;
}