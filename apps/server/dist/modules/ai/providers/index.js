import { streamGeminiResponse, } from "./gemini.js";
export async function streamAiProvider(messages, onToken) {
    await streamGeminiResponse(messages, onToken);
}
