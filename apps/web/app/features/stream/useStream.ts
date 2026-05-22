import { useEffect, useRef } from "react";
import { createSSE } from "./sse";
import { useInterviewStore } from "../interview/store";

export const useStream = (url: string, enabled: boolean) => {
  const appendAiToken = useInterviewStore((s) => s.appendAiToken);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);

  useEffect(() => {
    let isActive = true;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      esRef.current?.close();
      esRef.current = null;
      if (retryTimeout) clearTimeout(retryTimeout);
    };

    if (!enabled) {
      cleanup();
      return;
    }

    const connect = () => {
      esRef.current = createSSE(url, (data) => {
        if (!isActive) return;

        if (typeof data === "string") {
          appendAiToken(data);
        } else if (
          typeof data === "object" &&
          data !== null &&
          "text" in data &&
          typeof data.text === "string"
        ) {
          appendAiToken(data.text);
        }
      });

      esRef.current.onopen = () => {
        retryRef.current = 0;
      };

      esRef.current.onerror = () => {
        if (!isActive) return;

        cleanup();

        // exponential backoff (max 10s)
        const delay = Math.min(1000 * 2 ** retryRef.current, 10000);
        retryRef.current++;

        retryTimeout = setTimeout(() => {
          if (isActive) connect();
        }, delay);
      };
    };
    connect();

    return () => {
      isActive = false;
      retryRef.current = 0;
      cleanup();
    };
  }, [url, enabled, appendAiToken]);
};
