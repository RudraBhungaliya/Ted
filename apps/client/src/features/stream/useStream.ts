import { useEffect, useRef } from "react";
import { createSSE } from "./sse";
import { useInterviewStore } from "../interview/store";

export const useStream = (url : string, enabled : boolean) => {
    const addChunk = useInterviewStore((s) => s.addChunk);
    const esRef = useRef<EventSource | null> (null);

    useEffect(() => {
        if(!enabled) return;
        let isActive = true;
        let retryTimeout: ReturnType<typeof setTimeout> | undefined;

        const connect = () => {
            esRef.current = createSSE(url, (data) => {
                if(isActive && data?.text) addChunk(data.text);
            });

            esRef.current.onerror = () => {
                if(!isActive) return;
                esRef.current?.close();

                // retry after delay
                retryTimeout = setTimeout(() => {
                    if(isActive) {
                        connect();
                    }
                }, 2000);
            };
        };

        connect();

        return () => {
            isActive = false;
            esRef.current?.close();
            if(retryTimeout) {
                clearTimeout(retryTimeout);
            }
        };
    }, [url, enabled]);
};