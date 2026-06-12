import { extractTextFromImage, terminateOCRWorker } from "./ocr";

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

/**
 * Acquires (or reuses) a single screen-share stream that ALWAYS includes audio.
 *
 * IMPORTANT: We always request audio:true on the underlying getDisplayMedia call,
 * regardless of the `audio` param, so that:
 *  - The user is only ever prompted ONCE per session (no double prompts)
 *  - OCR (video-only consumers) and AudioEngine (audio consumer) share the
 *    exact same stream/surface — they stay in sync
 *  - "Share system audio" (YouTube, Spotify, YT Music, anything) is captured
 *    from the very first prompt, no matter which consumer asks first
 *
 * The `audio` param is now only used to decide whether the CALLER cares about
 * audio tracks being present — it no longer changes the getDisplayMedia request.
 */
export async function acquireScreenShareStream(audio = false) {
  if (screenShareStream) {
    screenShareConsumers += 1;
    return screenShareStream;
  }

  if (!screenSharePrompt) {
    screenSharePrompt = navigator.mediaDevices.getDisplayMedia({
      // No displaySurface constraint: lets Chrome offer Tab / Window / Entire
      // Screen, and lets the user pick whichever supports system audio best.
      video: {
        frameRate: 15,
      },
      // ALWAYS request audio so OCR-only callers don't lock in an audio-less
      // stream that AudioEngine would then have to re-prompt for.
      audio: {
        // These constraints are advisory; Chrome decides what it can deliver
        // based on the surface picked (tab/window/screen) and user checkbox.
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    } as DisplayMediaStreamOptions);
  }

  screenShareStream = await screenSharePrompt;
  screenSharePrompt = null;
  screenShareConsumers = 1;

  const audioTracks = screenShareStream.getAudioTracks();
  console.log("[ScreenCapture] Stream acquired. Audio tracks:", audioTracks.length);

  if (audio && audioTracks.length === 0) {
    console.warn(
      "[ScreenCapture] No system audio captured. " +
      "In the share dialog, make sure 'Share tab audio' / 'Share system audio' is checked, " +
      "and prefer sharing a 'Chrome Tab' or 'Window' rather than 'Entire Screen' for more reliable audio on Windows.",
    );
  }

  // If a track ends (user clicks "Stop sharing"), fully reset state.
  screenShareStream.getTracks().forEach((track) => {
    track.addEventListener("ended", () => {
      releaseScreenShareStream(true);
    });
  });

  return screenShareStream;
}

export function releaseScreenShareStream(force = false) {
  if (!force && screenShareConsumers > 0) {
    screenShareConsumers -= 1;
  }

  if (!force && screenShareConsumers > 0) {
    return;
  }

  screenShareStream?.getTracks().forEach((track) => track.stop());
  screenShareStream = null;
  screenSharePrompt = null;
  screenShareConsumers = 0;
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
  // Note: always acquires the audio-inclusive stream now (see above);
  // this consumer just doesn't use the audio tracks itself.
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
      void terminateOCRWorker();
    },
  };
}