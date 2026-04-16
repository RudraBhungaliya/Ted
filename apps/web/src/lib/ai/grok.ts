export async function streamGrok(
  input: string,
  onChunk: (text: string) => void,
) {
  const res = await fetch(`${process.env.XAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-2",
      stream: true,
      messages: [
        { role: "system", content: "You are a real-time interview assistant." },
        { role: "user", content: input },
      ],
    }),
  });

  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    onChunk(chunk);
  }
}
