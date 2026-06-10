import { extractTextFromImage } from "./ocr";

const DEFAULT_SCREEN_ANALYSIS_INTERVAL_MS = 2500;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

let screenShareStream: MediaStream | null = null;
let screenShareConsumers = 0;
let screenSharePrompt: Promise<MediaStream> | null = null;

type ScreenAnalysisResponse = {
  headline?: string;
  analysis?: string;
  suggestedAction?: string;
  isCodingQuestion?: boolean;
  suggestedAnswer?: string;
  ocrText?: string;
};

type ScreenCaptureLoopOptions = {
  sessionId: string;
  getTranscript: () => string;
  onAnalysis?: (analysis: ScreenAnalysisResponse) => void;
  onError?: (message: string) => void;
  intervalMs?: number;
};

export type ScreenCaptureLoop = {
  stop: () => void;
};

export async function acquireScreenShareStream(audio = false) {
  if (
    screenShareStream &&
    (!audio || screenShareStream.getAudioTracks().length > 0)
  ) {
    screenShareConsumers += 1;
    return screenShareStream;
  }

  if (
    screenShareStream &&
    audio &&
    screenShareStream.getAudioTracks().length === 0
  ) {
    releaseScreenShareStream();
  }

  if (!screenSharePrompt) {
    screenSharePrompt = navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 15 },
      audio,
    });
  }

  screenShareStream = await screenSharePrompt;
  screenSharePrompt = null;
  screenShareConsumers = 1;

  return screenShareStream;
}

export function releaseScreenShareStream() {
  if (screenShareConsumers > 0) {
    screenShareConsumers -= 1;
  }

  if (screenShareConsumers > 0) {
    return;
  }

  screenShareStream?.getTracks().forEach((track) => track.stop());
  screenShareStream = null;
  screenSharePrompt = null;
}

async function captureFrame(video: HTMLVideoElement) {
  const width = video.videoWidth;
  const height = video.videoHeight;

  if (!width || !height) {
    throw new Error("Screen capture is not ready yet.");
  }

  const maxWidth = 1280;
  const scale = Math.min(1, maxWidth / width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(width * scale));
  canvas.height = Math.max(1, Math.floor(height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create capture canvas.");
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export async function startScreenAnalysisLoop(
  options: ScreenCaptureLoopOptions,
): Promise<ScreenCaptureLoop> {
  const stream = await acquireScreenShareStream(false);

  const video = document.createElement("video");
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;

  await video.play();

  let stopped = false;
  const intervalMs = options.intervalMs ?? DEFAULT_SCREEN_ANALYSIS_INTERVAL_MS;

  const sendFrame = async () => {
    if (stopped) return;

    try {
      const image = await captureFrame(video);
      const ocrText = await extractTextFromImage(image);

      const response = await fetch(`${API_BASE_URL}/screen/analyze`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: options.sessionId,
          transcript: options.getTranscript(),
          image,
          ocrText,
        }),
      });

      if (!response.ok) {
        throw new Error("Screen analysis request failed.");
      }

      const data = (await response.json()) as {
        analysis?: ScreenAnalysisResponse;
      };

      if (data.analysis) {
        options.onAnalysis?.(data.analysis);
      }
    } catch (error) {
      options.onError?.(
        error instanceof Error ? error.message : "Screen analysis failed.",
      );
    }
  };

  await sendFrame();

  const timer = window.setInterval(() => {
    void sendFrame();
  }, intervalMs);

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      window.clearInterval(timer);
      releaseScreenShareStream();
      video.pause();
      video.srcObject = null;
    },
  };
}
