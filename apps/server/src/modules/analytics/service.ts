const fillerWords = [
  "um",

  "uh",

  "like",

  "basically",

  "actually",

  "you know",

  "sort of",

  "kind of",
];

function countFillerWords(text: string) {
  const lower = text.toLowerCase();

  let count = 0;

  for (const filler of fillerWords) {
    const matches = lower.match(new RegExp(`\\b${filler}\\b`, "g"));

    count += matches?.length ?? 0;
  }

  return count;
}

function detectStarFormat(text: string) {
  const lower = text.toLowerCase();

  const hasSituation =
    lower.includes("situation") ||
    lower.includes("project") ||
    lower.includes("team");

  const hasTask = lower.includes("task") || lower.includes("responsible");

  const hasAction =
    lower.includes("implemented") ||
    lower.includes("built") ||
    lower.includes("created");

  const hasResult =
    lower.includes("result") ||
    lower.includes("improved") ||
    lower.includes("%");

  return hasSituation && hasTask && hasAction && hasResult;
}

export function analyzeAnswer(text: string) {
  const words = text.split(/\s+/).filter(Boolean);

  const fillerCount = countFillerWords(text);

  const starFormat = detectStarFormat(text);

  const confidenceScore = Math.max(
    0,

    100 - fillerCount * 4 - (words.length < 20 ? 20 : 0),
  );

  return {
    totalWords: words.length,

    fillerCount,

    confidenceScore,

    usesStarFormat: starFormat,
  };
}
