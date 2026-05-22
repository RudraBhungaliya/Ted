import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENAI_REALTIME_SECRET_URL =
  "https://api.openai.com/v1/realtime/client_secrets";

const SESSION_CONFIG = {
  session: {
    type: "realtime",
    model: "gpt-realtime",
    output_modalities: ["text"],
    instructions:
      "You are Ted, a fast private copilot for interviews, meetings, and live questions. Answer every clear question immediately in concise text. Lead with the answer.",
    audio: {
      input: {
        transcription: {
          model: "gpt-4o-mini-transcribe",
        },
        noise_reduction: {
          type: "near_field",
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.42,
          prefix_padding_ms: 250,
          silence_duration_ms: 280,
          interrupt_response: true,
          create_response: true,
        },
      },
    },
  },
};

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Missing OPENAI_API_KEY. Add it to apps/web/.env.local or your shell environment.",
      },
      { status: 500 },
    );
  }

  const response = await fetch(OPENAI_REALTIME_SECRET_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(SESSION_CONFIG),
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      {
        error:
          body?.error?.message ??
          "OpenAI could not create a realtime client secret.",
      },
      { status: response.status },
    );
  }

  return NextResponse.json(body);
}
