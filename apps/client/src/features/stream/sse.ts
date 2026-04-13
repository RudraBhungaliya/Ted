export const createSSE = (
  url: string,
  onMessage: (data: unknown) => void,
) => {
  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onMessage(parsed);
    } catch {
      onMessage(event.data);
    }
  };

  es.onerror = (err) => {
    console.warn("SSE error:", err);
  };

  return es; // Event Source
};
