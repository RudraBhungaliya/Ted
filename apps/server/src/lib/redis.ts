import Redis from "ioredis";
import { env } from "../config/env.js";

export const redis = new (Redis as any)(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times: number) {
        return Math.min(times * 100, 3000);
    },
});

redis.on("error", (_err: unknown) => {
    // Avoid crashing on unhandled error if Redis is restarting or offline in dev
});
