"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { useInterviewStore } from "../features/interview/store";
import {
  X,
  EyeOff,
  Maximize2,
  Sparkles,
  Zap,
  Briefcase,
  Coffee,
  Monitor,
} from "lucide-react";
import {
  startScreenAnalysisLoop,
  type ScreenCaptureLoop,
} from "../lib/screen/capture";

type Props = {
  children?: ReactNode;
  onStart: () => void;
  onStop: () => void;
  onSetMode?: (mode: "interview" | "meeting") => void;
};

type SessionPhase = "idle" | "mode-selection" | "active";

export default function FloatingPanel({
  children,
  onStart,
  onStop,
  onSetMode,
}: Props) {
  const isRecording = useInterviewStore((state) => state.isRecording);
  const isAiResponding = useInterviewStore((state) => state.isAiResponding);
  const isConnected = useInterviewStore((state) => state.isConnected);
  const status = useInterviewStore((state) => state.status);

  const history = useInterviewStore((state) => state.history);
  const finalTranscript = useInterviewStore((state) => state.finalTranscript);
  const partialTranscript = useInterviewStore(
    (state) => state.partialTranscript,
  );
  const aiResponse = useInterviewStore((state) => state.aiResponse);
  const sessionMode = useInterviewStore((state) => state.sessionMode);
  const screenAssistEnabled = useInterviewStore(
    (state) => state.screenAssistEnabled,
  );
  const screenAnalysis = useInterviewStore((state) => state.screenAnalysis);
  const realtimeSessionId = useInterviewStore(
    (state) => state.realtimeSessionId,
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const transcriptSnapshotRef = useRef("");
  const answerRef = useRef<HTMLDivElement>(null);

  // Cluely-style conversation history memory states
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ question: string; answer: string }>
  >([]);
  const [currentQuestion, setCurrentQuestion] = useState("");

  // Process history to sync conversationHistory and currentQuestion
  useEffect(() => {
    const pairs: Array<{ question: string; answer: string }> = [];
    let currentPair: { question: string; answer: string } | null = null;

    for (const turn of history) {
      if (turn.role === "interviewer") {
        if (currentPair) {
          pairs.push(currentPair);
        }
        currentPair = { question: turn.text, answer: "" };
      } else if (turn.role === "ai" || turn.role === "assistant") {
        if (currentPair) {
          currentPair.answer = turn.text;
          pairs.push(currentPair);
          currentPair = null;
        }
      }
    }
    if (currentPair) {
      pairs.push(currentPair);
    }

    // Keep the latest pair pinned at top (reversed order)
    const reversed = [...pairs].reverse();
    setConversationHistory(reversed);

    // Get the latest completed interviewer question
    const lastInterviewer = history
      .slice()
      .reverse()
      .find((t) => t.role === "interviewer");
    if (lastInterviewer) {
      setCurrentQuestion(lastInterviewer.text);
    } else {
      setCurrentQuestion("");
    }
  }, [history]);

  // Answer display helper
  const displayAnswer = isAiResponding
    ? aiResponse
    : (conversationHistory[0]?.answer || "Waiting for question...");

  // Keep scroll position pinned to the top of the answer container while streaming or on question change
  useEffect(() => {
    if (answerRef.current) {
      if (isAiResponding) {
        answerRef.current.scrollTop = 0;
      }
    }
  }, [displayAnswer, isAiResponding]);

  useEffect(() => {
    if (answerRef.current) {
      answerRef.current.scrollTop = 0;
    }
  }, [currentQuestion]);

  // Track the lifecycle of session configuration local to this panel
  const [phase, setPhase] = useState<SessionPhase>("idle");

  // Synchronize phase with external recording state changes
  useEffect(() => {
    if (isRecording) {
      setPhase("active");
    } else if (phase === "active" && !isRecording) {
      setPhase("idle");
    }
  }, [isRecording]);

  useEffect(() => {
    transcriptSnapshotRef.current = [
      ...history.map((turn) => `${turn.role}: ${turn.text}`),
      finalTranscript ? `final: ${finalTranscript}` : "",
      partialTranscript ? `partial: ${partialTranscript}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }, [history, finalTranscript, partialTranscript]);

  const [isStealth, setIsStealth] = useState(false);
  const [savedSize, setSavedSize] = useState({ width: 380, height: 480 });
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    setIsIframe(typeof window !== "undefined" && window.parent !== window);
  }, []);

  // Mouse hover click-through management for Electron transparent window
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const desktopControls = (
      window as Window & {
        desktopControls?: {
          setClickThrough?: (enabled: boolean) => void;
        };
      }
    ).desktopControls;

    if (!desktopControls || !desktopControls.setClickThrough) return;

    if (isStealth) {
      desktopControls.setClickThrough(true);
    } else {
      // If hovered, we want to intercept mouse events (setClickThrough = false)
      // If not hovered, we want to ignore mouse events (setClickThrough = true)
      desktopControls.setClickThrough(!isHovered);
    }
  }, [isStealth, isHovered]);

  // Bounding rect safety check to ensure hover toggles reliably
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      const inside =
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      if (inside !== isHovered) {
        setIsHovered(inside);
      }
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
    };
  }, [isHovered]);

  const screenLoopRef = useRef<ScreenCaptureLoop | null>(null);

  useEffect(() => {
    if (!isRecording || !screenAssistEnabled || !realtimeSessionId) {
      screenLoopRef.current?.stop();
      screenLoopRef.current = null;
      return;
    }

    let cancelled = false;

    void startScreenAnalysisLoop({
      sessionId: realtimeSessionId,
      getTranscript: () => transcriptSnapshotRef.current,
      onAnalysis: (analysis) => {
        if (cancelled) {
          return;
        }

        const text = [
          analysis.headline,
          analysis.analysis,
          analysis.suggestedAction,
        ]
          .filter(Boolean)
          .join("\n");

        useInterviewStore.getState().setScreenAnalysis(text);
      },
      onError: (message) => {
        if (!cancelled) {
          useInterviewStore.getState().setError(message);
        }
      },
    })
      .then((loop) => {
        if (cancelled) {
          loop.stop();
          return;
        }

        screenLoopRef.current = loop;
      })
      .catch((error) => {
        if (!cancelled) {
          useInterviewStore
            .getState()
            .setError(
              error instanceof Error ? error.message : "Screen assist failed.",
            );
        }
      });

    return () => {
      cancelled = true;
      screenLoopRef.current?.stop();
      screenLoopRef.current = null;
    };
  }, [isRecording, screenAssistEnabled, realtimeSessionId]);

  // Draggable and Resizable state
  const panelRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 380, height: 480 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState<"right" | "bottom" | "both">(
    "both",
  );
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

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
      window.parent.postMessage(
        {
          type: "TED_LAYOUT_UPDATE",
          isRecording,
          isStealth,
          size,
        },
        "*",
      );
    }
  }, [isIframe, isRecording, isStealth, size]);

  // Listen for PING from parent window content script to trigger initial layout sync
  useEffect(() => {
    if (!isIframe) return;

    const handlePingMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "PING") {
        window.parent.postMessage(
          {
            type: "TED_LAYOUT_UPDATE",
            isRecording,
            isStealth,
            size,
          },
          "*",
        );
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
          const clampedX = Math.max(
            12,
            Math.min(window.innerWidth - size.width - 12, newX),
          );
          const clampedY = Math.max(
            12,
            Math.min(window.innerHeight - size.height - 12, newY),
          );
          setPosition({ x: clampedX, y: clampedY });
        }
      } else if (isResizing) {
        if (isIframe) {
          const deltaX = e.clientX - resizeStart.x;
          const deltaY = e.clientY - resizeStart.y;
          window.parent.postMessage(
            { type: "TED_RESIZE", deltaX, deltaY, resizeType },
            "*",
          );
          setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height,
          });
        } else {
          const deltaX = e.clientX - resizeStart.x;
          const deltaY = e.clientY - resizeStart.y;
          const minW = isStealth ? 200 : 300;
          const minH = isStealth ? 100 : 250;
          let newWidth = size.width;
          let newHeight = size.height;

          if (resizeType === "right" || resizeType === "both") {
            newWidth = Math.max(
              minW,
              Math.min(800, resizeStart.width + deltaX),
            );
          }
          if (resizeType === "bottom" || resizeType === "both") {
            newHeight = Math.max(
              minH,
              Math.min(850, resizeStart.height + deltaY),
            );
          }

          setSize({ width: newWidth, height: newHeight });
          setPosition((prev) => {
            const clampedX = Math.min(
              prev.x,
              window.innerWidth - newWidth - 12,
            );
            const clampedY = Math.min(
              prev.y,
              window.innerHeight - newHeight - 12,
            );
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
  }, [
    isDragging,
    isResizing,
    dragStart,
    resizeStart,
    size,
    isStealth,
    resizeType,
    isIframe,
  ]);

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

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    type: "right" | "bottom" | "both" = "both",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeType(type);
    if (isIframe) {
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height,
      });
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
        window.parent.postMessage(
          { type: "TED_STEALTH_TOGGLE", isStealth: true, size: newStealthSize },
          "*",
        );
      }
    } else {
      setSize(savedSize);
      setIsStealth(false);
      if (isIframe) {
        window.parent.postMessage(
          { type: "TED_STEALTH_TOGGLE", isStealth: false, size: savedSize },
          "*",
        );
      }
    }
  };

  const toggleScreenAssist = () => {
    useInterviewStore.getState().setScreenAnalysis("");
    useInterviewStore.getState().setScreenAssistEnabled(!screenAssistEnabled);
  };

  const handleSelectMode = (mode: "interview" | "meeting") => {
    if (onSetMode) onSetMode(mode);
    onStart();
    setPhase("active");
  };

  // Phase 1: Show the standard initialization widget
  if (phase === "idle") {
    return (
      <div
        ref={panelRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
          onClick={() => setPhase("mode-selection")}
          className="flex items-center gap-2.5 px-4.5 py-2.5 rounded-full bg-neutral-900/90 backdrop-blur-xl border border-white/8 text-zinc-200 hover:text-white hover:border-indigo-500/50 hover:bg-neutral-950 shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-indigo-500/10 cursor-pointer transition-all hover:scale-105 active:scale-95 group font-semibold text-xs tracking-wide whitespace-nowrap"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <Zap className="w-3.5 h-3.5 fill-white/10 text-indigo-400" />
          Start Ted
        </button>
      </div>
    );
  }

  // Phase 2: Force selection of Session Mode prior to calling onStart
  if (phase === "mode-selection") {
    return (
      <div
        ref={panelRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`z-50 rounded-2xl overflow-hidden border select-none bg-neutral-950/85 backdrop-blur-3xl border-white/12 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] ${isIframe ? "absolute w-full h-full inset-0" : "fixed"}`}
        style={
          isIframe
            ? { width: "100%", height: "100%", left: 0, top: 0 }
            : {
                width: `${size.width}px`,
                height: `${size.height}px`,
                left: hasInitialized ? `${position.x}px` : "auto",
                top: hasInitialized ? `${position.y}px` : "auto",
                right: hasInitialized ? "auto" : "24px",
                bottom: hasInitialized ? "auto" : "24px",
              }
        }
      >
        <div className="w-full h-full flex flex-col p-6 items-center justify-center relative">
          <button
            onClick={() => setPhase("idle")}
            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="mb-6 text-center">
            <h3 className="text-sm font-bold text-zinc-100 tracking-wide mb-1">
              Select Session Mode
            </h3>
            <p className="text-[11px] text-zinc-400 max-w-[240px]">
              Choose your target configuration. Mode adjustments are locked once
              execution begins.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-[260px]">
            <button
              onClick={() => handleSelectMode("interview")}
              className="flex items-center gap-3 w-full text-left p-3.5 rounded-xl border border-white/5 bg-neutral-900/50 hover:bg-neutral-900 hover:border-indigo-500/40 text-zinc-300 hover:text-white transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold">Interview Mode</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Real-time suggested responses
                </div>
              </div>
            </button>

            <button
              onClick={() => handleSelectMode("meeting")}
              className="flex items-center gap-3 w-full text-left p-3.5 rounded-xl border border-white/5 bg-neutral-900/50 hover:bg-neutral-900 hover:border-indigo-500/40 text-zinc-300 hover:text-white transition-all cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold">Meeting Mode</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Comprehensive real-time transcript
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Phase 3: Active session configuration
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`z-50 rounded-2xl overflow-hidden border select-none transition-all duration-300 ease-out
          ${isIframe ? "absolute w-full h-full inset-0" : "fixed"}
          ${
            isStealth
              ? "bg-neutral-950/40 backdrop-blur-md border-white/5 opacity-50 hover:opacity-100 shadow-xl"
              : `bg-neutral-950/75 backdrop-blur-3xl border-white/8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]
                 ${
                   isAiResponding
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
                transition:
                  isDragging || isResizing
                    ? "none"
                    : "all 0.15s ease-out, border-color 0.5s ease, shadow 0.5s ease",
              }
        }
      >
        {/* Glow Effects (only in standard mode) */}
        {!isStealth && (
          <>
            <div
              className={`absolute top-0 left-0 w-full h-1/2 bg-linear-to-b ${isAiResponding ? "from-indigo-500/10" : "from-indigo-600/5"} to-transparent blur-3xl pointer-events-none transition-all duration-700`}
            />
            <div
              className={`absolute bottom-0 right-0 w-32 h-32 ${isAiResponding ? "bg-indigo-500/5" : "bg-purple-500/5"} rounded-full blur-3xl pointer-events-none transition-all duration-700`}
            />
          </>
        )}

        {/* Content container */}
        <div className={`relative z-10 w-full h-full flex flex-col ${isStealth ? "p-2.5" : "p-4"}`}>
          {/* Top Bar / Drag Handle */}
          <div
            onMouseDown={handleMouseDown}
            className="flex items-center justify-between mb-3 select-none cursor-grab active:cursor-grabbing p-1.5 -m-1.5 rounded-xl hover:bg-white/5 transition-colors"
          >
            {/* Grip handle indicator */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none opacity-40">
              <span className="w-1 h-1 rounded-full bg-zinc-500" />
              <span className="w-1 h-1 rounded-full bg-zinc-500" />
              <span className="w-1 h-1 rounded-full bg-zinc-500" />
            </div>

            {/* Listening Wave & Status Info */}
            <div className="flex items-center gap-2">
              <div className="flex items-end gap-0.75 h-4 px-1">
                <div
                  className={`w-0.75 rounded-full bg-indigo-400 voice-bar voice-bar-1 ${!isConnected ? "paused" : ""}`}
                />
                <div
                  className={`w-0.75 rounded-full bg-indigo-400 voice-bar voice-bar-2 ${!isConnected ? "paused" : ""}`}
                />
                <div
                  className={`w-0.75 rounded-full bg-indigo-400 voice-bar voice-bar-3 ${!isConnected ? "paused" : ""}`}
                />
                <div
                  className={`w-0.75 rounded-full bg-purple-400 voice-bar voice-bar-4 ${!isConnected ? "paused" : ""}`}
                />
                <div
                  className={`w-0.75 rounded-full bg-purple-400 voice-bar voice-bar-5 ${!isConnected ? "paused" : ""}`}
                />
                <div
                  className={`w-0.75 rounded-full bg-pink-400 voice-bar voice-bar-6 ${!isConnected ? "paused" : ""}`}
                />
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
                    "Interview Session"
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
            <div className="flex items-center gap-1 relative z-20">
              {!isStealth && (
                <button
                  onClick={toggleScreenAssist}
                  className={`rounded-lg p-1.5 transition-all border border-transparent cursor-pointer flex items-center gap-1 ${
                    screenAssistEnabled
                      ? "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-white/10 hover:border-white/5"
                  }`}
                  title={screenAssistEnabled ? "Disable Screen Assist" : "Enable Screen Assist"}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  {screenAssistEnabled && (
                    <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
                  )}
                </button>
              )}
              <button
                onClick={toggleStealth}
                className="text-zinc-400 hover:text-zinc-100 hover:bg-white/10 rounded-lg p-1.5 transition-all border border-transparent hover:border-white/5 cursor-pointer"
                title={isStealth ? "Expand" : "Stealth Mode"}
              >
                {isStealth ? (
                  <Maximize2 className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
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

          {/* Screen Assist Display */}
          {screenAssistEnabled && screenAnalysis && !isStealth && (
            <div className="mb-3 rounded-xl border border-indigo-500/15 bg-indigo-500/5 p-3 text-xs text-zinc-300">
              <div className="mb-1 font-semibold text-indigo-300 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                Screen Insight
              </div>
              <div className="whitespace-pre-line text-zinc-400 leading-relaxed max-h-24 overflow-y-auto custom-scrollbar">
                {screenAnalysis}
              </div>
            </div>
          )}

          {/* Main Interview Q&A Layout (Cluely style) */}
          <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${isStealth ? "gap-2" : "gap-3.5"}`}>
            {/* Section 1: QUESTION */}
            <div className={`flex-none rounded-xl border border-zinc-800 bg-zinc-900/40 ${isStealth ? "p-2" : "p-4"}`}>
              {!isStealth && (
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 font-bold select-none">
                  Question
                </div>
              )}
              <div className={`text-zinc-200 whitespace-pre-wrap font-medium ${isStealth ? "text-[11px] leading-snug" : "text-sm leading-relaxed"}`}>
                {currentQuestion || "Waiting for interviewer..."}
              </div>
            </div>

            {/* Section 2: ANSWER */}
            <div className={`flex-1 flex flex-col rounded-xl border border-indigo-500/15 bg-neutral-900/30 min-h-0 ${isStealth ? "p-2" : "p-4"}`}>
              {!isStealth && (
                <div className="flex-none text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 font-bold select-none">
                  Answer
                </div>
              )}
              <div
                ref={answerRef}
                className={`flex-1 overflow-y-auto custom-scrollbar whitespace-pre-wrap text-zinc-100 font-normal ${isStealth ? "text-[11px] leading-snug" : "text-sm leading-relaxed"}`}
              >
                {displayAnswer}
              </div>
            </div>

            {/* 
              Future Session-History Rendering:
              To render the entire question & answer history in the scrolling container,
              replace the single displayAnswer above with the following map:
              
              {conversationHistory.map((pair, index) => (
                <div key={index} className="mb-4 last:mb-0 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-semibold">
                    Question {conversationHistory.length - index}
                  </div>
                  <div className="text-zinc-200 text-sm font-medium mb-2">
                    {pair.question}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-semibold">
                    Answer {conversationHistory.length - index}
                  </div>
                  <div className="text-zinc-100 text-sm leading-relaxed">
                    {index === 0 && isAiResponding ? aiResponse : (pair.answer || "Waiting...")}
                  </div>
                </div>
              ))}
            */}
          </div>

          {/* Hidden children */}
          <div className="hidden">{children}</div>
        </div>

        {/* Resize Handles */}
        {!isStealth && (
          <>
            {/* Right edge resizer */}
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, "right")}
              className="absolute top-0 right-0 bottom-4 w-1.5 cursor-ew-resize hover:bg-indigo-500/10 active:bg-indigo-500/30 z-100 transition-colors"
              title="Drag to resize width"
            />
            {/* Bottom edge resizer */}
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, "bottom")}
              className="absolute bottom-0 left-0 right-4 h-1.5 cursor-ns-resize hover:bg-indigo-500/10 active:bg-indigo-500/30 z-100 transition-colors"
              title="Drag to resize height"
            />
            {/* Bottom-right diagonal corner resizer */}
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, "both")}
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 z-101 group/resize hover:bg-indigo-500/20 active:bg-indigo-500/40 rounded-br-2xl transition-colors"
              title="Drag to resize size"
            >
              <svg
                width="8"
                height="8"
                viewBox="0 0 8 8"
                className="text-zinc-500 group-hover/resize:text-indigo-400 transition-colors pointer-events-none"
              >
                <line
                  x1="8"
                  y1="0"
                  x2="0"
                  y2="8"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <line
                  x1="8"
                  y1="4"
                  x2="4"
                  y2="8"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </>
        )}
      </div>
    </>
  );
}
