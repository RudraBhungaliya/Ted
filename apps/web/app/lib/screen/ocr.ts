let cachedWorker: any = null;

export async function extractTextFromImage(dataUrl: string): Promise<string> {
  try {
    const { createWorker } = await import("tesseract.js");
    if (!cachedWorker) {
      cachedWorker = await createWorker("eng");
    }
    const result = await cachedWorker.recognize(dataUrl);
    return result.data.text.replace(/\s+/g, " ").trim();
  } catch (error) {
    console.warn("OCR extraction failed:", error);
    return "";
  }
}

export async function terminateOCRWorker(): Promise<void> {
  if (cachedWorker) {
    try {
      await cachedWorker.terminate();
    } catch (err) {
      console.warn("Failed to terminate OCR worker:", err);
    }
    cachedWorker = null;
  }
}

