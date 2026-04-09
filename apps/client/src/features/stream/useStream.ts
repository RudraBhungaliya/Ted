import { useEffect, useRef } from "react";
import { createSSE } from "./sse";
import { useInterviewStore } from "../interview/store";

export const useStream = (url : string, enabled : boolean) => {
    const addChunk = useInterviewStore((s) => s.addChunk);
    const esRef = useRef<EventSource | null> (null);

    useEffect(() => {
        if(!enabled) return;
        let retryTimeout : NodeJS.Timeout;

        const connect = () => {
            esRef.current = createSSE(url, (data) => {
                if(data?.text) addChunk(data.text);
            });

            esRef.current.onerror = () => {
                esRef.current?.close();

                // retry after delay
                retryTimeout = setTimeout(() => {
                    connect();
                }, 2000);
            };
        };

        connect();

        return () => {
            esRef.current?.close();
            clearTimeout(retryTimeout);
        };
    }, [url, enabled]);
};