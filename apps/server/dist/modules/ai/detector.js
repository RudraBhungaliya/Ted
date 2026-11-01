const questionPatterns = [
    "?",
    "tell me",
    "what is",
    "explain",
    "why",
    "how",
    "what",
    "difference between",
    "can you",
    "could you",
    "walk me through",
    "describe",
    "have you",
    "did you",
    "when did",
    "where did",
    "what is",
    "what are",
    "how do",
    "how would",
    "why did",
    "introduce yourself",
    "meaning of",
    "define",
    "what does",
    "what's",
    "meaning",
    "definition",
    "clarify",
];
export function isInterviewQuestion(text) {
    if (!text.trim())
        return false;
    const lower = text.toLowerCase().trim();
    if (lower.length < 8)
        return false;
    return questionPatterns.some((pattern) => lower.includes(pattern));
}
const recentQuestions = new Map();
const QUESTION_COOLDOWN_MS = 12000;
export function isDuplicateQuestion(sessionId, text) {
    const normalized = text.toLowerCase().trim();
    const existing = recentQuestions.get(sessionId);
    if (!existing) {
        recentQuestions.set(sessionId, {
            text: normalized,
            timestamp: Date.now(),
        });
        return false;
    }
    const sameQuestion = existing.text === normalized;
    const withinCooldown = Date.now() - existing.timestamp < QUESTION_COOLDOWN_MS;
    if (sameQuestion && withinCooldown) {
        return true;
    }
    recentQuestions.set(sessionId, {
        text: normalized,
        timestamp: Date.now(),
    });
    return false;
}
