export async function extractTextFromImage(dataUrl: string): Promise<string> {
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    const result = await worker.recognize(dataUrl);
    await worker.terminate();
    return result.data.text.replace(/\s+/g, " ").trim();
  } catch (error) {
    console.warn("OCR extraction failed:", error);
    return "";
  }
}
