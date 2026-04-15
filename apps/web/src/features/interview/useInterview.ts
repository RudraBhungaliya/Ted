import { useRef } from "react";
import { useMic } from "../audio/useMic";
import { sendAudioChunk, startSession, stopSession } from "../../lib/api";
import { useInterviewStore } from "./store";

export const useInterview = () => {
    const { start, stop } = useMic();
    const sessionIdRef = useRef<string | null>(null);
    
    const startInterview = useInterviewStore((s) => s.start);
    const stopInterview = useInterviewStore((s) => s.stop);

    const handleStart = async () => {
        startInterview();
        try {
            const session = await startSession();
            const resolvedSessionId =
                session?.sessionId ?? session?.id ?? session?.session_id ?? "default";
            sessionIdRef.current = String(resolvedSessionId);

            await start(async (blob) => {
                try {
                    await sendAudioChunk(sessionIdRef.current ?? "default", blob);
                }
                catch(err) {
                    console.error("Audio Upload Failed", err);
                }
            });
        }
        catch(err) {
            console.error("Failed to start interview server session", err);
        }
    };

    const handleStop = async () => {
        stopInterview();
        stop();

        if (sessionIdRef.current) {
            try {
                await stopSession(sessionIdRef.current);
            } catch (err) {
                console.error("Failed to stop session", err);
            } finally {
                sessionIdRef.current = null;
            }
        }
    };

    return { handleStart, handleStop };
}