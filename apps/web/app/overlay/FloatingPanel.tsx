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
import { billingApi } from "../lib/api/endpoints";

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

  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    async function checkSubscription() {
      try {
        const res = await billingApi.getSubscription();
        if (res && res.data && res.data.status === "ACTIVE") {
          const expiresAt = res.data.expiresAt;
          const remaining = new Date(expiresAt).getTime() - Date.now();
          if (remaining > 0) {
            setIsSubscribed(true);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load subscription status:", err);
      }
      setIsSubscribed(false);
    }
    void checkSubscription();
  }, []);

  useEffect(() => {
    const desktopControls = (window as any).desktopControls;
    if (desktopControls?.setContentProtection) {
      desktopControls.setContentProtection(isSubscribed);
    }
  }, [isSubscribed]);

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
    : (conversationHistory[0]?.answer || (sessionMode === "meeting" ? "Waiting for discussion..." : "Waiting for question..."));

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

  // Target website selection state
  const [targetUrl, setTargetUrl] = useState("https://leetcode.com");
  const [customUrl, setCustomUrl] = useState("");

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
    let finalUrl = targetUrl.trim();
    if (finalUrl) {
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = "https://" + finalUrl;
      }
      const desktopControls = (window as any).desktopControls;
      if (desktopControls?.navigateTo) {
        desktopControls.navigateTo(finalUrl);
      }
    }

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
        className={`${isIframe ? "absolute w-full h-full inset-0 flex items-center justify-center" : "fixed z-50 transition-all"}`}
        style={
          isIframe
            ? {}
            : {
                left: hasInitialized ? `${position.x}px` : "auto",
                top: hasInitialized ? `${position.y}px` : "auto",
                right: hasInitialized ? "auto" : "24px",
                bottom: hasInitialized ? "auto" : "24px",
                transition: isDragging ? "none" : "all 0.15s ease-out",
              }
        }
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-xl border border-stone-200 shadow-md">
          <div
            onMouseDown={handleMouseDown}
            className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 p-1 rounded-md"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="9" cy="5" r="1" />
              <circle cx="9" cy="12" r="1" />
              <circle cx="9" cy="19" r="1" />
              <circle cx="15" cy="5" r="1" />
              <circle cx="15" cy="12" r="1" />
              <circle cx="15" cy="19" r="1" />
            </svg>
          </div>
          <button
            onClick={() => setPhase("mode-selection")}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900 text-white hover:bg-stone-800 shadow-xs cursor-pointer transition-all active:scale-95 font-semibold text-xs tracking-wide whitespace-nowrap"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Start Ted
          </button>
        </div>
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
        className={`z-50 rounded-3xl overflow-hidden border select-none bg-white/95 backdrop-blur-2xl border-stone-200/90 shadow-xl ${isIframe ? "absolute w-full h-full inset-0" : "fixed"}`}
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
                transition: isDragging || isResizing ? "none" : "all 0.15s ease-out",
              }
        }
      >
        <div className="w-full h-full flex flex-col p-6 items-center justify-center relative">
          <div
            onMouseDown={handleMouseDown}
            className="absolute top-0 left-0 right-0 h-10 cursor-grab active:cursor-grabbing flex items-center justify-center"
          >
            <div className="w-8 h-1 bg-stone-300 rounded-full" />
          </div>

          <button
            onClick={() => setPhase("idle")}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="mb-5 text-center">
            <h3 className="text-base font-bold text-stone-900 tracking-tight mb-1">
              Choose Session Mode
            </h3>
            <p className="text-xs text-stone-500 max-w-[240px] leading-relaxed">
              Select how you would like Ted to assist your conversation today.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-[260px]">
            <button
              onClick={() => handleSelectMode("interview")}
              className="flex items-center gap-3 w-full text-left p-3.5 rounded-2xl border border-stone-200 bg-white hover:border-orange-300 hover:bg-orange-50/40 text-stone-800 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="p-2 rounded-xl bg-orange-100 text-orange-800">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-stone-900">Assistant Mode</div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Interview speaking cues & guidance
                </div>
              </div>
            </button>

            <button
              onClick={() => handleSelectMode("meeting")}
              className="flex items-center gap-3 w-full text-left p-3.5 rounded-2xl border border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 text-stone-800 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-stone-900">Meeting Mode</div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Comprehensive meeting notes
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
          background: #d6d3d1;
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a29e;
        }
      `}</style>

      <div
        ref={panelRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`z-50 rounded-3xl overflow-hidden border select-none transition-all duration-200 ease-out text-stone-900
          ${isIframe ? "absolute w-full h-full inset-0" : "fixed"}
          ${
            isStealth
              ? "bg-white/90 backdrop-blur-md border-stone-300 opacity-70 hover:opacity-100 shadow-md"
              : `bg-white/95 backdrop-blur-2xl border-stone-200/90 shadow-[0_20px_45px_-12px_rgba(0,0,0,0.12)]
                 ${
                   isAiResponding
                     ? "border-amber-300 ring-2 ring-amber-100"
                     : "border-stone-200"
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
                transition: "border-color 0.3s ease",
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
                    : "all 0.15s ease-out, border-color 0.3s ease",
              }
        }
      >
        {/* Content container */}
        <div className={`relative z-10 w-full h-full flex flex-col ${isStealth ? "p-2.5" : "p-4"}`}>
          {/* Top Bar / Drag Handle */}
          <div
            onMouseDown={handleMouseDown}
            className="flex items-center justify-between mb-3 select-none cursor-grab active:cursor-grabbing p-1.5 -m-1.5 rounded-xl hover:bg-stone-100 transition-colors"
          >
            {/* Grip handle indicator */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none opacity-40">
              <span className="w-1 h-1 rounded-full bg-stone-400" />
              <span className="w-1 h-1 rounded-full bg-stone-400" />
              <span className="w-1 h-1 rounded-full bg-stone-400" />
            </div>

            {/* Listening Wave & Status Info */}
            <div className="flex items-center gap-2">
              <div className="flex items-end gap-0.75 h-4 px-1">
                <div
                  className={`w-0.75 rounded-full bg-orange-500 voice-bar voice-bar-1 ${!isConnected ? "paused" : ""}`}
                />
                <div
                  className={`w-0.75 rounded-full bg-amber-500 voice-bar voice-bar-2 ${!isConnected ? "paused" : ""}`}
                />
                <div
                  className={`w-0.75 rounded-full bg-amber-500 voice-bar voice-bar-3 ${!isConnected ? "paused" : ""}`}
                />
                <div
                  className={`w-0.75 rounded-full bg-emerald-500 voice-bar voice-bar-4 ${!isConnected ? "paused" : ""}`}
                />
                <div
                  className={`w-0.75 rounded-full bg-emerald-600 voice-bar voice-bar-5 ${!isConnected ? "paused" : ""}`}
                />
                <div
                  className={`w-0.75 rounded-full bg-blue-500 voice-bar voice-bar-6 ${!isConnected ? "paused" : ""}`}
                />
              </div>

              <div className="flex flex-col">
                <span className="font-semibold text-xs tracking-tight text-stone-900">
                  {isAiResponding ? (
                    <span className="text-amber-800 font-bold flex items-center gap-1.5">
                      Suggested Note Ready
                    </span>
                  ) : isStealth ? (
                    "Ted (Compact)"
                  ) : (
                    sessionMode === "meeting" ? "Meeting Notes" : "Interview Notes"
                  )}
                </span>
                {!isStealth && (
                  <span className="text-[9px] text-stone-600 uppercase font-medium tracking-wider -mt-0.5">
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
                      ? "text-blue-700 bg-blue-50 border-blue-200"
                      : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                  }`}
                  title={screenAssistEnabled ? "Disable Screen Assist" : "Enable Screen Assist"}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  {screenAssistEnabled && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  )}
                </button>
              )}
              <button
                onClick={toggleStealth}
                className="text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg p-1.5 transition-all cursor-pointer"
                title={isStealth ? "Expand" : "Compact Mode"}
              >
                {isStealth ? (
                  <Maximize2 className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={onStop}
                className="text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1.5 transition-all cursor-pointer"
                title="Stop Session"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Screen Assist Display */}
          {screenAssistEnabled && screenAnalysis && !isStealth && (
            <div className="mb-3 rounded-2xl border border-blue-200/80 bg-blue-50/60 p-3 text-xs text-blue-950 shadow-2xs">
              <div className="mb-1 font-semibold text-blue-900 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-blue-600" />
                Screen Context
              </div>
              <div className="whitespace-pre-line text-blue-900/80 leading-relaxed max-h-24 overflow-y-auto custom-scrollbar">
                {screenAnalysis}
              </div>
            </div>
          )}

          {/* Main Interview Q&A Layout */}
          <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${isStealth ? "gap-2" : "gap-3"}`}>
            {/* Section 1: QUESTION / INPUT */}
            <div className={`flex-none rounded-2xl border border-stone-200/90 bg-stone-50/80 shadow-2xs ${isStealth ? "p-2" : "p-3.5"}`}>
              {!isStealth && (
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-stone-600 mb-1 font-semibold select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                  {sessionMode === "meeting" ? "Meeting Speech" : "Spoken Question"}
                </div>
              )}
              <div className={`text-stone-800 whitespace-pre-wrap font-medium ${isStealth ? "text-[11px] leading-snug" : "text-sm leading-relaxed"}`}>
                {currentQuestion || (sessionMode === "meeting" ? "Listening to meeting audio..." : "Waiting for spoken question...")}
              </div>
            </div>

            {/* Section 2: ANSWER / NOTE */}
            <div className={`flex-1 flex flex-col rounded-2xl border border-amber-200/90 bg-amber-50/70 min-h-0 shadow-2xs ${isStealth ? "p-2" : "p-3.5"}`}>
              {!isStealth && (
                <div className="flex items-center gap-1.5 flex-none text-[10px] uppercase tracking-wider text-amber-900 mb-1.5 font-bold select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  {sessionMode === "meeting" ? "Live Notes" : "Suggested Response"}
                </div>
              )}
              <div
                ref={answerRef}
                className={`flex-1 overflow-y-auto custom-scrollbar whitespace-pre-wrap text-stone-900 font-normal leading-relaxed ${isStealth ? "text-[11px] leading-snug" : "text-sm"}`}
              >
                {displayAnswer || "Notes and responses will stream here in real time."}
              </div>
            </div>
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
              className="absolute top-0 right-0 bottom-4 w-1.5 cursor-ew-resize hover:bg-stone-300 active:bg-stone-400 z-100 transition-colors"
              title="Drag to resize width"
            />
            {/* Bottom edge resizer */}
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, "bottom")}
              className="absolute bottom-0 left-0 right-4 h-1.5 cursor-ns-resize hover:bg-stone-300 active:bg-stone-400 z-100 transition-colors"
              title="Drag to resize height"
            />
            {/* Bottom-right diagonal corner resizer */}
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, "both")}
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 z-101 group/resize hover:bg-stone-200 active:bg-stone-300 rounded-br-2xl transition-colors"
              title="Drag to resize size"
            >
              <svg
                width="8"
                height="8"
                viewBox="0 0 8 8"
                className="text-stone-400 group-hover/resize:text-stone-700 transition-colors pointer-events-none"
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
