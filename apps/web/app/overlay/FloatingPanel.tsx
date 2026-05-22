"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { useInterviewStore } from "../features/interview/store";
import { X, Activity, EyeOff, Maximize2, Mic, GripHorizontal } from "lucide-react";
import TranscriptView from "../components/ui/TranscriptView";

type Props = {
  children?: ReactNode;
  onStart: () => void;
  onStop: () => void;
};

export default function FloatingPanel({ children, onStop }: Props) {
  const isRecording = useInterviewStore((state) => state.isRecording);
  const isAiResponding = useInterviewStore((state) => state.isAiResponding);
  
  const [isStealth, setIsStealth] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Draggable state
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    if ((e.target as HTMLElement).closest("button")) {
      return; // Do not drag if clicking headers buttons
    }

    let currentX = position.x;
    let currentY = position.y;

    if (!hasMoved && panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      currentX = rect.left;
      currentY = rect.top;
      setPosition({ x: currentX, y: currentY });
      setHasMoved(true);
    }

    setIsDragging(true);
    setDragStart({
      x: e.clientX - currentX,
      y: e.clientY - currentY,
    });
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  if (!isRecording) return null;

  return (
    <>
      <div 
        ref={panelRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed z-50 transition-shadow duration-500 ease-in-out ${
          isStealth 
            ? "top-10 right-10 w-[240px] h-auto max-h-[200px] opacity-40 hover:opacity-100 bg-white/70 backdrop-blur-md border-zinc-200/50 shadow-lg" 
            : `w-[340px] h-[400px] bg-white/95 backdrop-blur-2xl border-zinc-200/60 shadow-2xl ${
                isAiResponding 
                  ? "shadow-indigo-500/25 border-indigo-400/60 ring-2 ring-indigo-500/10" 
                  : "shadow-indigo-500/15"
              } ${
                !hasMoved ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" : ""
              }`
        } rounded-2xl overflow-hidden border`}
        style={
          hasMoved && !isStealth
            ? {
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: "none",
                transition: isDragging ? "none" : "all 0.15s ease-out",
              }
            : {}
        }
      >
        
        {/* Glow Effects (only in standard mode) */}
        {!isStealth && (
           <>
            <div className={`absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b ${isAiResponding ? 'from-indigo-200/80' : 'from-indigo-100'} to-transparent blur-2xl pointer-events-none transition-all duration-700`}></div>
            <div className={`absolute bottom-0 right-0 w-32 h-32 ${isAiResponding ? 'bg-indigo-100' : 'bg-blue-100'} rounded-full blur-3xl pointer-events-none transition-all duration-700`}></div>
           </>
        )}
        
        {/* Content container */}
        <div className="relative z-10 w-full h-full flex flex-col p-4">
          
          {/* Top Bar / Drag Handle */}
          <div 
            onMouseDown={handleMouseDown}
            className={`flex items-center justify-between mb-4 select-none cursor-grab active:cursor-grabbing p-1.5 -m-1.5 rounded-xl hover:bg-zinc-100/50 transition-colors ${
              isStealth && !isHovered ? 'opacity-0' : 'opacity-100'
            } transition-opacity`}
          >
            
            <div className="flex items-center gap-2">
               {isAiResponding ? (
                 <div className="flex items-center gap-0.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]" />
                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]" />
                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
                 </div>
               ) : isStealth ? (
                 <Mic className="w-4 h-4 text-indigo-500 animate-pulse" />
               ) : (
                 <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
               )}
               {!isStealth && (
                 <span className="font-semibold text-xs tracking-wide text-zinc-700 flex items-center gap-1.5">
                   {isAiResponding ? (
                     <span className="text-indigo-600 font-bold">AI Responding</span>
                   ) : (
                     "Ted Active"
                   )}
                   <GripHorizontal className="w-3.5 h-3.5 text-zinc-300 ml-1.5 opacity-50" />
                 </span>
               )}
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsStealth(!isStealth)} 
                className="text-zinc-500 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-md p-1.5 transition-all"
                title={isStealth ? "Expand" : "Stealth Mode"}
              >
                {isStealth ? <Maximize2 className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={onStop} 
                className="text-zinc-500 hover:text-red-500 bg-zinc-100 hover:bg-red-50 rounded-md p-1.5 transition-all"
                title="Stop & Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Transcript Area */}
          <div className={`flex-1 overflow-y-auto w-full ${isStealth ? 'text-xs text-zinc-600' : 'bg-zinc-50 rounded-xl border border-zinc-200/50 p-3 text-sm text-zinc-700'}`}>
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
