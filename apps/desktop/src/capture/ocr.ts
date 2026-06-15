import Tesseract from "tesseract.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const workerPath = require.resolve("tesseract.js/src/worker-script/node/index.js");

export async function extractScreenText(
  image: Buffer | string,
): Promise<string> {
  try {
    const { data } = await Tesseract.recognize(image, "eng", {
      workerPath,
      logger: () => {},
    });

    return data.text.trim();
  } catch (err) {
    console.error("[OCR]", err);
    return "";
  }
}
