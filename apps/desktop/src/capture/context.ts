export function buildContext(rawText: string) {
  const text = rawText
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    text,
    length: text.length,
    timestamp: Date.now(),
  };
}
