import Redis from "ioredis";
import { env } from "../config/env.js";
export const redis = new Redis(env.REDIS_URL);
redis.on("error", (err) => {
    // Avoid crashing on unhandled error if Redis is restarting or offline in dev
});
