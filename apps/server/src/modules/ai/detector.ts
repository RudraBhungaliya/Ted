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
];

export function isInterviewQuestion(text: string) {
  if (!text.trim()) return false;

  const lower = text.toLowerCase().trim();

  if (lower.length < 8) return false;

  return questionPatterns.some((pattern) => lower.includes(pattern));
}

const recentQuestions = new Map<
  string,
  {
    text: string;
    timestamp: number;
  }
>();

const QUESTION_COOLDOWN_MS = 12000;

export function isDuplicateQuestion(sessionId: string, text: string) {
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
