// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1",
  TIMEOUT: 30000,
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
