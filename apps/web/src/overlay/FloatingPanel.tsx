"use client";

import { ReactNode } from "react";
import { useInterviewStore } from "../features/interview/store";
import { X, Activity } from "lucide-react";

type Props = {
  children?: ReactNode;
  onStart: () => void;
  onStop: () => void;
};

export default function FloatingPanel({ children, onStop }: Props) {
  const isRecording = useInterviewStore((state) => state.isRecording);

  if (!isRecording) return null;

  return (
    <>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[380px] rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.15)] backdrop-blur-2xl z-50 animate-in fade-in zoom-in duration-300 border border-white/10">
        
        {/* Sleek dark glass with purple neon mesh gradient effect */}
        <div className="absolute inset-0 bg-[#0A0A0A]/80"></div>
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-purple-500/20 to-transparent blur-2xl"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
        
        {/* Content container */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-5">
          
          {/* Top Bar with Close Button */}
          <div className="w-full flex justify-end">
            <button 
              onClick={onStop} 
              className="text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Center Logo & Brand */}
          <div className="flex flex-col items-center -mt-4 gap-6">
            {/* Reflex Activity Logo */}
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center relative shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              <div className="absolute inset-px bg-[#0a0a0a] rounded-2xl z-0"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 rounded-2xl z-0"></div>
              <Activity className="w-10 h-10 text-purple-400 z-10 relative" strokeWidth={2.5} />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-white text-2xl font-bold tracking-tight">Reflex Active</h2>
              <p className="text-sm font-medium text-purple-400 animate-pulse">Initializing streaming...</p>
            </div>
          </div>

          {/* Bottom Loading Indicator */}
          <div className="mb-6 flex gap-1 items-center justify-center w-full">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>

          <div className="hidden">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
