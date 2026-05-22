// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1",
  TIMEOUT: 30000,
} as const;

function buildRealtimeWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
  const url = new URL(apiBase.replace(/\/api\/v1\/?$/, "") || "http://localhost:4000");
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/realtime";
  return url.toString();
}

export const REALTIME_CONFIG = {
  WS_URL: buildRealtimeWsUrl(),
  SAMPLE_RATE: 16000,
  ENCODING: "linear16",
} as const;

// Feature Flags
export const FEATURES = {
  ENABLE_AUTH: true,
  ENABLE_RECORDING: true,
  ENABLE_STREAMING: true,
} as const;

// Defaults
export const DEFAULTS = {
  PAGINATION_LIMIT: 20,
  DEBOUNCE_DELAY: 300,
} as const;
