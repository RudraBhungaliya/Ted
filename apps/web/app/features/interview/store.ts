import { create } from "zustand";

type HistoryTurn = {
  id: string;
  role: "user" | "assistant" | "interviewer" | "ai";
  speakerName: string;
  text: string;
};

function normalizeWords(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function combineTranscriptText(previous: string, next: string) {
  const left = previous.trim();
  const right = next.trim();

  if (!left) return right;
  if (!right) return left;
  if (right.startsWith(left)) return right;
  if (left.startsWith(right)) return left;

  const leftWords = normalizeWords(left);
  const rightWords = normalizeWords(right);
  const normalizedLeft = leftWords.join(" ");
  const normalizedRight = rightWords.join(" ");

  if (normalizedRight.startsWith(normalizedLeft)) return right;
  if (normalizedLeft.startsWith(normalizedRight)) return left;

  const maxOverlap = Math.min(leftWords.length, rightWords.length);
  for (let size = maxOverlap; size > 0; size -= 1) {
    if (
      leftWords.slice(-size).join(" ") ===
      rightWords.slice(0, size).join(" ")
    ) {
      return `${left} ${rightWords.slice(size).join(" ")}`.trim();
    }
  }

  return `${left} ${right}`.trim();
}

function shouldMergeTurns(previous: HistoryTurn | undefined, next: Omit<HistoryTurn, "id">) {
  return (
    previous &&
    previous.role === next.role &&
    previous.speakerName === next.speakerName
  );
}

type InterviewState = {
  isRecording: boolean;
  isConnected: boolean;
  realtimeSessionId: string | null;
  partialTranscript: string;
  finalTranscript: string;
  aiResponse: string;
  isAiResponding: boolean;
  status: string;
  error: string | null;
  history: HistoryTurn[];
  sessionMode: "interview" | "meeting";
  screenAssistEnabled: boolean;
  screenAnalysis: string;

  start: (sessionId: string) => void;

  stop: () => void;

  setConnected: (connected: boolean) => void;

  setPartialTranscript: (text: string) => void;

  appendFinalTranscript: (text: string) => void;

  setFinalTranscript: (text: string) => void;

  appendAiToken: (token: string) => void;

  setAiResponding: (responding: boolean) => void;

  clearAiResponse: () => void;

  setStatus: (status: string) => void;

  setError: (error: string | null) => void;

  setHistory: (history: HistoryTurn[]) => void;

  addHistoryTurn: (turn: HistoryTurn) => void;

  addTranscriptTurn: (
    turn: Omit<HistoryTurn, "id"> & { id?: string },
  ) => void;

  setSessionMode: (mode: "interview" | "meeting") => void;

  setScreenAssistEnabled: (enabled: boolean) => void;

  setScreenAnalysis: (analysis: string) => void;

  clear: () => void;
};

export const useInterviewStore = create<InterviewState>((set) => ({
  isRecording: false,
  isConnected: false,
  realtimeSessionId: null,
  partialTranscript: "",
  finalTranscript: "",
  aiResponse: "",
  isAiResponding: false,
  status: "Idle",
  error: null,
  history: [],
  sessionMode: "interview",
  screenAssistEnabled: false,
  screenAnalysis: "",

  start: (sessionId: string) =>
    set({
      isRecording: true,
      realtimeSessionId: sessionId,
      partialTranscript: "",
      finalTranscript: "",
      aiResponse: "",
      isAiResponding: false,
      status: "Connecting",
      error: null,
    }),

  stop: () =>
    set({
      isRecording: false,
      isAiResponding: false,
      status: "Idle",
    }),

  setConnected: (connected: boolean) =>
    set({
      isConnected: connected,
    }),

  setPartialTranscript: (text) =>
    set({
      partialTranscript: text,
    }),

  appendFinalTranscript: (text: string) =>
    set((state) => ({
      finalTranscript: state.finalTranscript
        ? `${state.finalTranscript} ${text}`.trim()
        : text,
      partialTranscript: "",
    })),

  setFinalTranscript: (text: string) =>
    set({
      finalTranscript: text,
      partialTranscript: "",
    }),

  appendAiToken: (token) =>
    set((state) => ({
      aiResponse: state.aiResponse + token,
    })),

  setAiResponding: (responding) =>
    set({
      isAiResponding: responding,
    }),

  clearAiResponse: () =>
    set({
      aiResponse: "",
    }),

  setStatus: (status) =>
    set({
      status,
    }),

  setError: (error) =>
    set({
      error,
    }),

  setHistory: (history) =>
    set({
      history,
    }),

  addHistoryTurn: (turn) =>
    set((state) => ({
      history: [...state.history.filter((t) => t.id !== turn.id), turn],
    })),

  addTranscriptTurn: (turn) =>
    set((state) => ({
      history: (() => {
        const previous = state.history[state.history.length - 1];

        if (shouldMergeTurns(previous, turn)) {
          return [
            ...state.history.slice(0, -1),
            {
              ...previous,
              text: combineTranscriptText(previous.text, turn.text),
            },
          ];
        }

        return [
          ...state.history,
          {
            id: turn.id ?? Math.random().toString(36).substring(2, 9),
            role: turn.role,
            speakerName: turn.speakerName,
            text: turn.text,
          },
        ];
      })(),
    })),

  setSessionMode: (sessionMode) =>
    set({
      sessionMode,
    }),

  setScreenAssistEnabled: (screenAssistEnabled) =>
    set({
      screenAssistEnabled,
    }),

  setScreenAnalysis: (screenAnalysis) =>
    set({
      screenAnalysis,
    }),

  clear: () =>
    set({
      partialTranscript: "",

      finalTranscript: "",

      aiResponse: "",

      isAiResponding: false,

      error: null,

      history: [],

      screenAssistEnabled: false,

      screenAnalysis: "",
    }),
}));

if (typeof window !== "undefined") {
  const channel = new BroadcastChannel("ted_channel");
  const tabId = Math.random().toString(36).substring(2, 9);
  let isIncomingSync = false;

  // Listen for updates from other tabs
  channel.onmessage = (event) => {
    const { type, payload, senderId } = event.data;
    if (type === "SYNC_STATE" && senderId !== tabId) {
      isIncomingSync = true;
      useInterviewStore.setState(payload);
      isIncomingSync = false;
    }
  };

  // Subscribe to local state changes and broadcast them
  useInterviewStore.subscribe((state) => {
    if (isIncomingSync) return;
    channel.postMessage({
      type: "SYNC_STATE",
      senderId: tabId,
      payload: {
        isRecording: state.isRecording,
        isConnected: state.isConnected,
        realtimeSessionId: state.realtimeSessionId,
        partialTranscript: state.partialTranscript,
        finalTranscript: state.finalTranscript,
        aiResponse: state.aiResponse,
        isAiResponding: state.isAiResponding,
        status: state.status,
        error: state.error,
        history: state.history,
        sessionMode: state.sessionMode,
        screenAssistEnabled: state.screenAssistEnabled,
        screenAnalysis: state.screenAnalysis,
      },
    });
  });
}

