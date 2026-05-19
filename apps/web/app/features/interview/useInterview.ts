import { useRef } from "react";

import { RealtimeClient } from "../../lib/realtime/client";

import { dbService } from "../../lib/db/postgre";

import { useInterviewStore } from "./store";

export const useInterview = () => {
  const clientRef = useRef(new RealtimeClient());

  const realtimeSessionIdRef = useRef<string | null>(null);

  const dbSessionIdRef = useRef<string | null>(null);

  const startInterview = useInterviewStore((s) => s.start);

  const stopInterview = useInterviewStore((s) => s.stop);

  const setConnected = useInterviewStore((s) => s.setConnected);

  const setPartialTranscript = useInterviewStore((s) => s.setPartialTranscript);

  const appendFinalTranscript = useInterviewStore(
    (s) => s.appendFinalTranscript,
  );

  const handleStart = async () => {
    try {
      const realtimeSessionId = crypto.randomUUID();

      realtimeSessionIdRef.current = realtimeSessionId;

      startInterview(realtimeSessionId);

      const dbSession = await dbService.startDBSession("New Interview Session");

      dbSessionIdRef.current = dbSession.id;

      clientRef.current.connect(
        realtimeSessionId,

        (text, isFinal) => {
          if (isFinal) {
            appendFinalTranscript(text);

            return;
          }

          setPartialTranscript(text);
        },
      );

      setConnected(true);

      await clientRef.current.startStreaming(realtimeSessionId);
    } catch (err) {
      console.error("Interview start failed", err);
    }
  };

  const handleStop = async () => {
    stopInterview();

    clientRef.current.disconnect();

    setConnected(false);

    if (dbSessionIdRef.current) {
      try {
        await dbService.stopDBSession(dbSessionIdRef.current);
      } catch (err) {
        console.error("Failed to stop DB session", err);
      }
    }

    realtimeSessionIdRef.current = null;

    dbSessionIdRef.current = null;
  };

  return {
    handleStart,

    handleStop,
  };
};
