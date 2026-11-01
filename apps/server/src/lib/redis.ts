import Redis from "ioredis";
import { env } from "../config/env.js";

export const redis = new (Redis as any)(
    env.REDIS_URL,
);

redis.on("error", (err: unknown) => {
    // Avoid crashing on unhandled error if Redis is restarting or offline in dev
});