import { useMic } from "../audio/useMic";
import { api } from "../../lib/api";
import { useInterviewStore } from "./store";

export const useInterview = () => {
    const { start, stop } = useMic();
    
    const startInterview = useInterviewStore((s) => s.start);
    const stopInterview = useInterviewStore((s) => s.stop);

    const handleStart = async () => {
        startInterview();

        await start(async (blob) => {
            const formData = new FormData();
            formData.append("audio", blob);

            try{
                await api.post("/interview/audio", formData);

            }
            catch(err){
                console.error("Audio Upload Failed", err);
            }
        });
    };

    const handleStop = () => {
        stop();
        stopInterview();
    }  

    return { handleStart, handleStop };
}