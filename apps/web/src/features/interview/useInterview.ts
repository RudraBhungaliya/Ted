import { useRef } from "react";
import { useMic } from "../audio/useMic";
import { dbService } from "../../lib/db/postgre";
import { useInterviewStore } from "./store";

export const useInterview = () => {
    const { start, stop } = useMic();
    const sessionIdRef = useRef<string | null>(null);
    
    const startInterview = useInterviewStore((s) => s.start);
    const stopInterview = useInterviewStore((s) => s.stop);

    const handleStart = async () => {
        startInterview();
        try {
            const session = await dbService.startDBSession("New Interview Session");
            sessionIdRef.current = session.id;

            await start(async (blob) => {
                try {
                    const formData = new FormData();
                    formData.append("audio", blob);
                    formData.append("sessionId", sessionIdRef.current!);

                    await fetch("/api/audio/upload", {
                        method : "POST",
                        body : formData,
                    });

                }
                catch(err) {
                    console.error("Audio Save Failed", err);
                }
            });
        }
        catch(err) {
            console.error("Failed to start indexeddb session", err);
        }
    };

    const handleStop = async () => {
        stopInterview();
        stop();

        if (sessionIdRef.current) {
            try {
                await dbService.stopDBSession(sessionIdRef.current);
            } catch (err) {
                console.error("Failed to stop session", err);
            } finally {
                // Ensure the list is re-fetched if we are displaying it. 
                // We will handle this in the page level or use a callback mechanism, 
                // but setting event allows components to know session stopped.
                window.dispatchEvent(new Event('session-stopped'));
                sessionIdRef.current = null;
            }
        }
    };

    return { handleStart, handleStop };
}