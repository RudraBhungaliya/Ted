"use client";

import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    RealtimeClient,
} from "../lib/realtime/client";

export function useRealtimeConversation(){
    const clientRef = useRef(new RealtimeClient());
    const sessionId = useRef(crypto.randomUUID());

    const [partialTranscript, setPartialTranscript] = useState("");
    const [finalTranscript, setFinalTranscript] = useState("");

    const [isListening, setIsListening] = useState(false);

    const [isConnected, setIsConnected] = useState(false);
    
    useEffect(() => {
        clientRef.current.connect(
            sessionId.current,
            (
                text : string,
                isFinal : boolean,
            ) => {
                if(isFinal){
                    setFinalTranscript((prev) => prev + " " + text);
                    setPartialTranscript("");
                    return;
                }

                setPartialTranscript(text);
            }
        );

        setIsConnected(true);

        return () => {
            clientRef.current.disconnect();
        };
    }, []);

    const startListening = async () => {
        await clientRef.current.startStreaming(sessionId.current);
        setIsListening(true);
    };

    const stopListening = () => {
        clientRef.current.stopStreaming();
        setIsListening(false);
    };

    return {
        startListening,
        stopListening,
        partialTranscript,
        finalTranscript,
        isListening,
        isConnected,
        sessionId : sessionId.current,
    }
}