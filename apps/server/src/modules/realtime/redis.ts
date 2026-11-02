import Redis from "ioredis";
import { env } from "../../config/env.js";

const redisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times: number) {
        return Math.min(times * 100, 3000);
    },
};

const publisher = new (Redis as any)(env.REDIS_URL, redisOptions);
const subscriber = new (Redis as any)(env.REDIS_URL, redisOptions);

publisher.on("error", (_err: unknown) => {});
subscriber.on("error", (_err: unknown) => {});

export const REDIS_CHANNELS = {
    audio: "ted:audio",
    transcript: "ted:transcript",
    ai: "ted:ai",
} as const;

export async function publishEvent(
    channel: string,
    payload: any,
) {
    try {
        await publisher.publish(
            channel,
            JSON.stringify(payload),
        );
    } catch (_err) {
        // Non-blocking in dev if Redis is temporarily offline
    }
}

export async function subscribeEvent(
    channel: string,
    handler: (payload: any) => void,
) {
    try {
        await subscriber.subscribe(channel);
    } catch (_err) {
        // Suppress failure when offline; ioredis will resubscribe once connected
    }

    subscriber.on(
        "message",
        (incomingChannel: any, message: any) => {
            if (incomingChannel !== channel) return;
            try {
                handler(JSON.parse(message));
            } catch (err) {
                console.error("Error parsing message on channel", channel, err);
            }
        }
    );
}