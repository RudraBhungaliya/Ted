"use client";

import { ReactNode } from "react";
import { useInterviewStore } from "../features/interview/store";  

type Props = {
    children : ReactNode;
    onStart : () => void;
    onStop : () => void;
}

export default function FloatingPanel({ children, onStart, onStop } : Props){
    const isRecording = useInterviewStore((state) => state.isRecording);

    return(
        <>
        <div className="fixed bottom-6 right-6 w-[360px] h-[420px] bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                <div className="text-sm font-medium">
                    {isRecording ? "Recording..." : "Idle"}
                </div>

                <button
                    onClick={isRecording ? onStop : onStart}
                    className="text-xs px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 transition"
                >
                    {isRecording ? "Stop" : "Start"}
                </button>
            </div>

            <div className="flex-1 p-3 overflow-hidden">
                {children}
            </div>
        </div>
        
        </>


    )

}