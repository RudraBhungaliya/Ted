import { publish } from "../../shared/lib/eventBus";
import fetch from "node-fetch";
import FormData from "form-data";

type UploadedAudioFile = Express.Multer.File;

type WhisperResponse = {
  text?: string;
};

let textBuffer = ""; // simple context buffer for demonstration purposes

export const uploadActive = async (file: UploadedAudioFile | undefined) => {
  if (!file) throw new Error("No file uploaded");

  const data = {
    fileName: file.originalname,
    size: file.size,
  };

  publish({ type: "audio_uploaded", data });
  return data;
};

export const processChunk = async (file: UploadedAudioFile | undefined) => {
  if (!file) throw new Error("No file uploaded");

  // speech to text (whisper)
  const formData = new FormData();
  formData.append("file", file.buffer, {
    filename: file.originalname || "audio.webm",
    contentType: file.mimetype,
  });
  formData.append("model", "whisper-1");

  try {
    const whisperRes = await fetch(
      "https://api.xai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROK_API_KEY}`,
        },
        body: formData as any,
      },
    );

    const whisperData = (await whisperRes.json()) as WhisperResponse;
    const text: string = whisperData?.text || "";

    if (!text.trim()) return { success: false, text: "" };

    publish({ type: "audio_processed", data: { text } });
    return { success: true, text };
  } catch (error) {
    console.error("Audio processing error:", error);
    throw error;
  }
};
