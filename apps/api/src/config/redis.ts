import Redis from "ioredis";
import { ENV } from "./environment";

export const redis = new Redis(ENV.REDIS_URL);

// Redis connection error handling
redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redis.on("connect", () => {
  console.log("Redis connected successfully");
});
