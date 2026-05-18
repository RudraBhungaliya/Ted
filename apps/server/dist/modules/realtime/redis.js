import Redis from "ioredis";
import { env, } from "../../config/env.js";
const publisher = new Redis(env.REDIS_URL);
const subscriber = new Redis(env.REDIS_URL);
export const REDIS_CHANNELS = {
    audio: "ted:audio",
    transcript: "ted:transcript",
    ai: "ted:ai",
};
export async function publishEvent(channel, payload) {
    await publisher.publish(channel, JSON.stringify(payload));
}
export async function subscribeEvent(channel, handler) {
    await subscriber.subscribe(channel);
    subscriber.on("message", (incomingChannel, message) => {
        if (incomingChannel !== channel)
            return;
        handler(JSON.parse(message));
    });
}
