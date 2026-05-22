export const REALTIME_EVENTS = {
  connection: {
    connected: "connection.connected",
    disconnected: "connection.disconnected",
    error: "connection.error",
  },
  session: {
    start: "session.start",
    end: "session.end",
  },
  audio: {
    chunk: "audio.chunk",
  },
  transcript: {
    partial: "transcript.partial",
    final: "transcript.final",
  },
  ai: {
    start: "ai.start",
    token: "ai.token",
    end: "ai.end",
    error: "ai.error",
    interrupt: "ai.interupt",
  },
} as const;

export type RealtimeInboundMessage = {
  event: string;
  payload?: {
    sessionId?: string;
    text?: string;
    token?: string;
    message?: string;
  };
};
