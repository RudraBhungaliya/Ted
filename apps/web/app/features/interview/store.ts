import { create } from "zustand";

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

  clear: () =>
    set({
      partialTranscript: "",

      finalTranscript: "",

      aiResponse: "",

      isAiResponding: false,

      error: null,
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
      },
    });
  });
}

