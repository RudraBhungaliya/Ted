export const createSSE = (url: string, onMessage: (data: any) => void) => {
  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onMessage(parsed);
    } catch (err) {
      console.error("Error parsing SSE data", err);
    }
  };

  es.onerror = (err) => {
    es.close();
  };

  return es; // Event Source
};
