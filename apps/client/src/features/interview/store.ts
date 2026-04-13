import { create } from "zustand";

type InterviewState = {
    isRecording: boolean;
    streamData: string[];
    
    start: () => void;
    stop: () => void;
    addChunk: (chunk : string) => void;
    clear: () => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
    isRecording : false,
    streamData : [],

    start : () => set({ isRecording : true, streamData : [] }),
    stop : () => set({ isRecording : false }),

    addChunk : (chunk) => 
        set((state) => ({
            streamData : [...state.streamData, chunk],
        })),
        clear : () => set({ streamData : [] }),
}));