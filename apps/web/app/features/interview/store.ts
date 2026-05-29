import { create } from "zustand";

type HistoryTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

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

  setSessionMode: (mode: "interview" | "meeting") => void;

  setScreenAssistEnabled: (enabled: boolean) => void;

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

  setSessionMode: (sessionMode) =>
    set({
      sessionMode,
    }),

  setScreenAssistEnabled: (screenAssistEnabled) =>
    set({
      screenAssistEnabled,
    }),

  clear: () =>
    set({
      partialTranscript: "",

      finalTranscript: "",

      aiResponse: "",

      isAiResponding: false,

      error: null,

      history: [],

      sessionMode: "interview",

      screenAssistEnabled: false,
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
      },
    });
  });
}

