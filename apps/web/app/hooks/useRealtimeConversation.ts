"use client";

import { useEffect, useRef, useState } from "react";

import { RealtimeClient } from "../lib/realtime/client";

export function useRealtimeConversation() {
  const clientRef = useRef(new RealtimeClient());
  const [sessionId] = useState(() => crypto.randomUUID());

  const [partialTranscript, setPartialTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);

  useEffect(() => {
    const client = clientRef.current;

    client
      .connect(
        sessionId,
        (text, isFinal) => {
          if (isFinal) {
            setFinalTranscript(text);
            setPartialTranscript("");
            return;
          }

          setPartialTranscript(text);
        },
        (token) => {
          setAiResponse((prev) => prev + token);
        },
        () => {
          setIsAiResponding(true);
          setAiResponse("");
        },
        () => {
          setIsAiResponding(false);
        },
      )
      .then(() => {
        setIsConnected(true);
      })
      .catch(() => {
        setIsConnected(false);
      });

    return () => {
      client.disconnect();
    };
  }, [sessionId]);

  const startListening = async () => {
    await clientRef.current.startStreaming();
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
    aiResponse,
    isListening,
    isConnected,
    isAiResponding,
    sessionId,
  };
}
