import { streamGeminiResponse, } from "./gemini.js";
export async function streamAiProvider(messages, onToken) {
    return streamGeminiResponse(messages, onToken);
}
