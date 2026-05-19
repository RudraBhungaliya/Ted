import { create } from "zustand";

type InterviewState = {
  isRecording: boolean;
  isConnected: boolean;
  realtimeSessionId: string | null;
  partialTranscript: string;
  finalTranscript: string;
  aiResponse: string;

  start: (sessionId: string) => void;

  stop: () => void;

  setConnected: (connected: boolean) => void;

  setPartialTranscript: (text: string) => void;

  appendFinalTranscript: (text: string) => void;

  appendAiToken: (token: string) => void;

  clear: () => void;
};

export const useInterviewStore = create<InterviewState>((set) => ({
  isRecording: false,
  isConnected: false,
  realtimeSessionId: null,
  partialTranscript: "",
  finalTranscript: "",
  aiResponse: "",

  start: (sessionId: string) =>
    set({
      isRecording: true,
      realtimeSessionId: sessionId,
      partialTranscript: "",
      finalTranscript: "",
      aiResponse: "",
    }),

  stop: () =>
    set({
      isRecording: false,
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
      finalTranscript: state.finalTranscript + " " + text,
      partialTranscript: "",
    })),

  appendAiToken: (token) =>
    set((state) => ({
      aiResponse: state.aiResponse + token,
    })),

  clear: () =>
    set({
      partialTranscript: "",

      finalTranscript: "",

      aiResponse: "",
    }),
}));
