import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("4000"),

  DATABASE_URL: z
    .string()
    .default("postgresql://rudra:qwerty@localhost:5432/ted"),

  REDIS_URL: z.string().default("redis://localhost:6379"),

  JWT_SECRET: z
    .string()
    .default("super_secret_jwt_key_ted_dev_2026_change_in_prod"),

  XAI_API_KEY: z.string().optional().default(""),

  XAI_API_BASE_URL: z.string().optional().default("https://api.x.ai/v1"),

  GEMINI_API_KEY: z.string().default(""),

  API_BASE_URL: z.string().optional().default("http://localhost:4000"),

  GOOGLE_CLIENT_ID: z.string().optional().default(""),

  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),

  GOOGLE_REDIRECT_URI: z
    .string()
    .default("http://localhost:4000/api/auth/google/callback"),

  CLIENT_REDIRECT_URL: z.string().default("http://localhost:3000"),

  MICROSOFT_CLIENT_ID: z.string().optional().default(""),

  RAZORPAY_KEY_ID: z.string().default("rzp_test_placeholder_key_id"),

  RAZORPAY_KEY_SECRET: z.string().default("placeholder_secret_key"),

  RAZORPAY_WEBHOOK_SECRET: z.string().default("placeholder_webhook_secret"),

  MICROSOFT_CLIENT_SECRET: z.string().optional().default(""),

  DEEPGRAM_API_KEY: z.string().default(""),

  AI_RESPONSE_DEBOUNCE_MS: z.string().default("120"),

  DEEPGRAM_ENDPOINTING_MS: z.string().default("160"),

  AI_MAX_HISTORY_TURNS: z.string().default("8"),
});

console.log("DATABASE_URL =", process.env.DATABASE_URL);

export const env = envSchema.parse(process.env);
