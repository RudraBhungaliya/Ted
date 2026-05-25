"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { useInterviewStore } from "../features/interview/store";
import { X, EyeOff, Maximize2, Sparkles, Zap } from "lucide-react";
import TranscriptView from "../components/ui/TranscriptView";

type Props = {
  children?: ReactNode;
  onStart: () => void;
  onStop: () => void;
};

export default function FloatingPanel({ children, onStart, onStop }: Props) {
  const isRecording = useInterviewStore((state) => state.isRecording);
  const isAiResponding = useInterviewStore((state) => state.isAiResponding);
  const isConnected = useInterviewStore((state) => state.isConnected);
  const status = useInterviewStore((state) => state.status);
  
  const [isStealth, setIsStealth] = useState(false);
  const [savedSize, setSavedSize] = useState({ width: 380, height: 480 });
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    setIsIframe(typeof window !== "undefined" && window.parent !== window);
  }, []);

  // Draggable and Resizable state
  const panelRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 380, height: 480 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState<"right" | "bottom" | "both">("both");
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Initialize position to bottom-right corner
  useEffect(() => {
    if (typeof window !== "undefined" && !hasInitialized && !isIframe) {
      const initialWidth = 380;
      const initialHeight = 480;
      const x = window.innerWidth - initialWidth - 24;
      const y = window.innerHeight - initialHeight - 24;
      setPosition({ x, y });
      setSize({ width: initialWidth, height: initialHeight });
      setHasInitialized(true);
    }
  }, [hasInitialized, isIframe]);

  // Send layout sync messages to parent (if inside iframe)
  useEffect(() => {
    if (isIframe && typeof window !== "undefined") {
      window.parent.postMessage({
        type: "TED_LAYOUT_UPDATE",
        isRecording,
        isStealth,
        size
      }, "*");
    }
  }, [isIframe, isRecording, isStealth, size]);

  // Listen for PING from parent window content script to trigger initial layout sync
  useEffect(() => {
    if (!isIframe) return;
    
    const handlePingMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "PING") {
        window.parent.postMessage({
          type: "TED_LAYOUT_UPDATE",
          isRecording,
          isStealth,
          size
        }, "*");
      }
    };

    window.addEventListener("message", handlePingMessage);
    return () => window.removeEventListener("message", handlePingMessage);
  }, [isIframe, isRecording, isStealth, size]);

  // Handle window resizing to keep the panel inside bounds
  useEffect(() => {
    if (isIframe) return;
    const handleWindowResize = () => {
      setPosition((prev) => {
        const maxX = window.innerWidth - size.width - 12;
        const maxY = window.innerHeight - size.height - 12;
        return {
          x: Math.max(12, Math.min(maxX, prev.x)),
          y: Math.max(12, Math.min(maxY, prev.y)),
        };
      });
    };
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [size, isIframe]);

  // Drag and Resize handler in window listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        if (isIframe) {
          const deltaX = e.clientX - dragStart.x;
          const deltaY = e.clientY - dragStart.y;
          window.parent.postMessage({ type: "TED_DRAG", deltaX, deltaY }, "*");
          setDragStart({ x: e.clientX, y: e.clientY });
        } else {
          const newX = e.clientX - dragStart.x;
          const newY = e.clientY - dragStart.y;
          const clampedX = Math.max(12, Math.min(window.innerWidth - size.width - 12, newX));
          const clampedY = Math.max(12, Math.min(window.innerHeight - size.height - 12, newY));
          setPosition({ x: clampedX, y: clampedY });
        }
      } else if (isResizing) {
        if (isIframe) {
          const deltaX = e.clientX - resizeStart.x;
          const deltaY = e.clientY - resizeStart.y;
          window.parent.postMessage({ type: "TED_RESIZE", deltaX, deltaY, resizeType }, "*");
          setResizeStart({ x: e.clientX, y: e.clientY, width: size.width, height: size.height });
        } else {
          const deltaX = e.clientX - resizeStart.x;
          const deltaY = e.clientY - resizeStart.y;
          const minW = isStealth ? 200 : 300;
          const minH = isStealth ? 100 : 250;
          let newWidth = size.width;
          let newHeight = size.height;
          
          if (resizeType === "right" || resizeType === "both") {
            newWidth = Math.max(minW, Math.min(800, resizeStart.width + deltaX));
          }
          if (resizeType === "bottom" || resizeType === "both") {
            newHeight = Math.max(minH, Math.min(850, resizeStart.height + deltaY));
          }
          
          setSize({ width: newWidth, height: newHeight });
          setPosition((prev) => {
            const clampedX = Math.min(prev.x, window.innerWidth - newWidth - 12);
            const clampedY = Math.min(prev.y, window.innerHeight - newHeight - 12);
            return { x: clampedX, y: clampedY };
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, size, isStealth, resizeType, isIframe]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    if ((e.target as HTMLElement).closest("button")) {
      return; // Ignore drag if button clicked
    }

    setIsDragging(true);
    if (isIframe) {
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
    e.preventDefault();
  };

  const handleResizeMouseDown = (e: React.MouseEvent, type: "right" | "bottom" | "both" = "both") => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeType(type);
    if (isIframe) {
      setResizeStart({ x: e.clientX, y: e.clientY, width: size.width, height: size.height });
    } else {
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height,
      });
    }
  };

  const toggleStealth = () => {
    if (!isStealth) {
      setSavedSize(size);
      const newStealthSize = { width: 240, height: 140 };
      setSize(newStealthSize);
      setIsStealth(true);
      if (isIframe) {
        window.parent.postMessage({ type: "TED_STEALTH_TOGGLE", isStealth: true, size: newStealthSize }, "*");
      }
    } else {
      setSize(savedSize);
      setIsStealth(false);
      if (isIframe) {
        window.parent.postMessage({ type: "TED_STEALTH_TOGGLE", isStealth: false, size: savedSize }, "*");
      }
    }
  };


  if (!isRecording) {
    return (
      <>
        <div 
          className={`${isIframe ? "absolute w-full h-full inset-0 flex items-center justify-center" : "fixed z-50 transition-all duration-300"}`}
          style={
            isIframe
              ? {}
              : {
                  left: hasInitialized ? `${position.x}px` : "auto",
                  top: hasInitialized ? `${position.y}px` : "auto",
                  right: hasInitialized ? "auto" : "24px",
                  bottom: hasInitialized ? "auto" : "24px",
                }
          }
        >
          <button
            onClick={onStart}
            className="flex items-center gap-2.5 px-4.5 py-2.5 rounded-full bg-neutral-900/90 backdrop-blur-xl border border-white/[0.08] text-zinc-200 hover:text-white hover:border-indigo-500/50 hover:bg-neutral-950 shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-indigo-500/10 cursor-pointer transition-all hover:scale-105 active:scale-95 group font-semibold text-xs tracking-wide whitespace-nowrap"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <Zap className="w-3.5 h-3.5 fill-white/10 text-indigo-400" />
            Start Ted
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes voiceWave {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        .voice-bar {
          animation: voiceWave 1.2s ease-in-out infinite;
        }
        .voice-bar-1 { animation-delay: 0.1s; }
        .voice-bar-2 { animation-delay: 0.25s; }
        .voice-bar-3 { animation-delay: 0.4s; }
        .voice-bar-4 { animation-delay: 0.55s; }
        .voice-bar-5 { animation-delay: 0.7s; }
        .voice-bar-6 { animation-delay: 0.85s; }
        
        .voice-bar.paused {
          animation-play-state: paused;
          height: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>

      <div 
        ref={panelRef}
        className={`z-50 rounded-2xl overflow-hidden border select-none transition-all duration-300 ease-out
          ${isIframe ? "absolute w-full h-full inset-0" : "fixed"}
          ${
            isStealth 
              ? "bg-neutral-950/40 backdrop-blur-md border-white/5 opacity-50 hover:opacity-100 shadow-xl" 
              : `bg-neutral-950/75 backdrop-blur-3xl border-white/[0.08] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]
                 ${isAiResponding 
                   ? "shadow-indigo-500/10 border-indigo-500/35 ring-1 ring-indigo-500/20" 
                   : "shadow-black/50"
                 }`
          }`}
        style={
          isIframe
            ? {
                width: "100%",
                height: "100%",
                left: 0,
                top: 0,
                transform: "none",
                transition: "border-color 0.5s ease, shadow 0.5s ease",
              }
            : {
                width: `${size.width}px`,
                height: `${size.height}px`,
                left: hasInitialized ? `${position.x}px` : "auto",
                top: hasInitialized ? `${position.y}px` : "auto",
                right: hasInitialized ? "auto" : "24px",
                bottom: hasInitialized ? "auto" : "24px",
                transform: "none",
                transition: isDragging || isResizing ? "none" : "all 0.15s ease-out, border-color 0.5s ease, shadow 0.5s ease",
              }
        }
      >
        {/* Glow Effects (only in standard mode) */}
        {!isStealth && (
          <>
            <div className={`absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b ${isAiResponding ? 'from-indigo-500/10' : 'from-indigo-600/5'} to-transparent blur-3xl pointer-events-none transition-all duration-700`} />
            <div className={`absolute bottom-0 right-0 w-32 h-32 ${isAiResponding ? 'bg-indigo-500/5' : 'bg-purple-500/5'} rounded-full blur-3xl pointer-events-none transition-all duration-700`} />
          </>
        )}
        
        {/* Content container */}
        <div className="relative z-10 w-full h-full flex flex-col p-4">
          
          {/* Top Bar / Drag Handle */}
          <div 
            onMouseDown={handleMouseDown}
            className="flex items-center justify-between mb-3.5 select-none cursor-grab active:cursor-grabbing p-1.5 -m-1.5 rounded-xl hover:bg-white/5 transition-colors"
          >
            {/* Grip handle indicator */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none opacity-40">
              <span className="w-1 h-1 rounded-full bg-zinc-500" />
              <span className="w-1 h-1 rounded-full bg-zinc-500" />
              <span className="w-1 h-1 rounded-full bg-zinc-500" />
            </div>

            {/* Listening Wave & Status Info */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-end gap-[3px] h-[16px] px-1">
                <div className={`w-[3px] rounded-full bg-indigo-400 voice-bar voice-bar-1 ${!isConnected ? 'paused' : ''}`} />
                <div className={`w-[3px] rounded-full bg-indigo-400 voice-bar voice-bar-2 ${!isConnected ? 'paused' : ''}`} />
                <div className={`w-[3px] rounded-full bg-indigo-400 voice-bar voice-bar-3 ${!isConnected ? 'paused' : ''}`} />
                <div className={`w-[3px] rounded-full bg-purple-400 voice-bar voice-bar-4 ${!isConnected ? 'paused' : ''}`} />
                <div className={`w-[3px] rounded-full bg-purple-400 voice-bar voice-bar-5 ${!isConnected ? 'paused' : ''}`} />
                <div className={`w-[3px] rounded-full bg-pink-400 voice-bar voice-bar-6 ${!isConnected ? 'paused' : ''}`} />
              </div>

              <div className="flex flex-col">
                <span className="font-semibold text-xs tracking-wide text-zinc-200">
                  {isAiResponding ? (
                    <span className="text-indigo-400 font-bold flex items-center gap-1.5">
                      AI Responding
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    </span>
                  ) : isStealth ? (
                    "Ted Stealth"
                  ) : (
                    "Ted Active"
                  )}
                </span>
                {!isStealth && (
                  <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase -mt-0.5">
                    {isConnected ? `${status}` : "Disconnected"}
                  </span>
                )}
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1.5 relative z-20">
              <button 
                onClick={toggleStealth} 
                className="text-zinc-400 hover:text-zinc-100 hover:bg-white/10 rounded-lg p-1.5 transition-all border border-transparent hover:border-white/5 cursor-pointer"
                title={isStealth ? "Expand" : "Stealth Mode"}
              >
                {isStealth ? <Maximize2 className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={onStop} 
                className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg p-1.5 transition-all border border-transparent hover:border-red-500/10 cursor-pointer"
                title="Stop & Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Transcript Area */}
          <div className={`flex-1 overflow-y-auto w-full custom-scrollbar select-text
            ${isStealth 
              ? 'text-xs text-zinc-400 bg-transparent py-1' 
              : 'bg-black/35 rounded-xl border border-white/5 p-3 text-sm text-zinc-300'
            }`}
          >
            <TranscriptView />
          </div>

          {/* Hidden children */}
          <div className="hidden">
            {children}
          </div>

        </div>

        {/* Resize Handles */}
        {!isStealth && (
          <>
            {/* Right edge resizer */}
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, "right")}
              className="absolute top-0 right-0 bottom-4 w-1.5 cursor-ew-resize hover:bg-indigo-500/10 active:bg-indigo-500/30 z-[100] transition-colors"
              title="Drag to resize width"
            />
            {/* Bottom edge resizer */}
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, "bottom")}
              className="absolute bottom-0 left-0 right-4 h-1.5 cursor-ns-resize hover:bg-indigo-500/10 active:bg-indigo-500/30 z-[100] transition-colors"
              title="Drag to resize height"
            />
            {/* Bottom-right diagonal corner resizer */}
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, "both")}
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 z-[101] group/resize hover:bg-indigo-500/20 active:bg-indigo-500/40 rounded-br-2xl transition-colors"
              title="Drag to resize size"
            >
              <svg
                width="8"
                height="8"
                viewBox="0 0 8 8"
                className="text-zinc-500 group-hover/resize:text-indigo-400 transition-colors pointer-events-none"
              >
                <line x1="8" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="8" y1="4" x2="4" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
          </>
        )}
      </div>
    </>
  );
}
