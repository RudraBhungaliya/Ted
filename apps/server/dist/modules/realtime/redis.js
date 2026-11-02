import Redis from "ioredis";
import { env } from "../../config/env.js";
const redisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
        return Math.min(times * 100, 3000);
    },
};
const publisher = new Redis(env.REDIS_URL, redisOptions);
const subscriber = new Redis(env.REDIS_URL, redisOptions);
publisher.on("error", (_err) => { });
subscriber.on("error", (_err) => { });
export const REDIS_CHANNELS = {
    audio: "ted:audio",
    transcript: "ted:transcript",
    ai: "ted:ai",
};
export async function publishEvent(channel, payload) {
    try {
        await publisher.publish(channel, JSON.stringify(payload));
    }
    catch (_err) {
        // Non-blocking in dev if Redis is temporarily offline
    }
}
export async function subscribeEvent(channel, handler) {
    try {
        await subscriber.subscribe(channel);
    }
    catch (_err) {
        // Suppress failure when offline; ioredis will resubscribe once connected
    }
    subscriber.on("message", (incomingChannel, message) => {
        if (incomingChannel !== channel)
            return;
        try {
            handler(JSON.parse(message));
        }
        catch (err) {
            console.error("Error parsing message on channel", channel, err);
        }
    });
}
