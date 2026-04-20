import Redis from "ioredis";
import { ENV } from "./env";

export const redis = new Redis(ENV.REDIS_URL);