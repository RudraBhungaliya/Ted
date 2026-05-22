import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({

  PORT:
    z.string()
      .default("4000"),

  DATABASE_URL:
    z.string()
      .optional(),

  REDIS_URL:
    z.string(),

  JWT_SECRET:
    z.string(),

  XAI_API_KEY:
    z.string()
      .optional(),

  XAI_API_BASE_URL:
    z.string()
      .optional(),

  GEMINI_API_KEY:
    z.string(),

  API_BASE_URL:
    z.string()
      .optional(),

  GOOGLE_CLIENT_ID:
    z.string()
      .optional(),

  GOOGLE_CLIENT_SECRET:
    z.string()
      .optional(),

  MICROSOFT_CLIENT_ID:
    z.string()
      .optional(),

  MICROSOFT_CLIENT_SECRET:
    z.string()
      .optional(),

  DEEPGRAM_API_KEY:
    z.string(),

});

export const env =
  envSchema.parse(
    process.env,
  );