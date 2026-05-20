import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    PORT: z.string().default("4000"),

    DATABASE_URL: z.string(),

    REDIS_URL: z.string(),

    JWT_SECRET: z.string(),

    XAI_API_KEY : z.string(),

    XAI_API_BASE_URL : z.string(),

    API_BASE_URL: z.string(),

    GOOGLE_CLIENT_ID: z.string(),

    GOOGLE_CLIENT_SECRET: z.string(),

    MICROSOFT_CLIENT_ID: z.string(),

    MICROSOFT_CLIENT_SECRET: z.string(),

    DEEPGRAM_API_KEY : z.string(),
});

export const env = envSchema.parse(
    process.env
);