"use client";

import { ReactNode, useState } from "react";
import { useInterviewStore } from "../features/interview/store";
import { X, Activity, EyeOff, Maximize2, Mic } from "lucide-react";
import TranscriptView from "../components/ui/TranscriptView";

type Props = {
  children?: ReactNode;
  onStart: () => void;
  onStop: () => void;
};

export default function FloatingPanel({ children, onStop }: Props) {
  const isRecording = useInterviewStore((state) => state.isRecording);
  const [isStealth, setIsStealth] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!isRecording) return null;

  return (
    <>
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed z-50 transition-all duration-500 ease-in-out ${
          isStealth 
            ? "top-10 right-10 w-[240px] h-auto max-h-[200px] opacity-40 hover:opacity-100 bg-black/40 backdrop-blur-sm border-transparent shadow-none" 
            : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[400px] bg-[#0A0A0A]/90 backdrop-blur-2xl border-white/10 shadow-[0_0_80px_rgba(139,92,246,0.15)]"
        } rounded-2xl overflow-hidden border`}
      >
        
        {/* Glow Effects (only in standard mode) */}
        {!isStealth && (
          <>
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-purple-500/10 to-transparent blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          </>
        )}
        
        {/* Content container */}
        <div className="relative z-10 w-full h-full flex flex-col p-4">
          
          {/* Top Bar */}
          <div className={`flex items-center justify-between mb-4 ${isStealth && !isHovered ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
            
            <div className="flex items-center gap-2">
               {isStealth ? (
                 <Mic className="w-4 h-4 text-purple-400 animate-pulse" />
               ) : (
                 <Activity className="w-5 h-5 text-purple-400" />
               )}
               {!isStealth && <span className="font-semibold text-sm text-zinc-200">Reflex Active</span>}
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsStealth(!isStealth)} 
                className="text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-md p-1.5 transition-all"
                title={isStealth ? "Expand" : "Stealth Mode"}
              >
                {isStealth ? <Maximize2 className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={onStop} 
                className="text-zinc-500 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-md p-1.5 transition-all"
                title="Stop & Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Transcript Area */}
          <div className={`flex-1 overflow-y-auto w-full ${isStealth ? 'text-xs text-zinc-400' : 'bg-black/40 rounded-xl border border-white/5 p-3 text-sm text-zinc-300'}`}>
            <TranscriptView />
          </div>

          {/* Render children hidden to keep logic intact */}
          <div className="hidden">
            {children}
          </div>

        </div>
      </div>
    </>
  );
}
