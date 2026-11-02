import { redis } from "../../lib/redis.js";

import {
    REDIS_KEYS,
} from "../../config/constants.js";

const SESSION_TTL = 60 * 60 * 24 * 7;// week

function getSessionKey(userId : string){
    return `${REDIS_KEYS.SESSION}:${userId}`;
}

export async function createSession(
    userId : string,
){
    try {
        await redis.set(
            getSessionKey(userId),
            "active",
            "EX",
            SESSION_TTL,
        );
    } catch (err) {
        console.warn("Failed to write session to Redis:", err);
    }
}

export async function validateSession(
    userId : string,
){
    try {
        const session = await redis.get(
            getSessionKey(userId),
        );
        return !!session;
    } catch (err) {
        console.warn("Failed to read session from Redis:", err);
        return true; // Fallback to allowing valid JWT token if Redis check is temporarily unavailable
    }
}

export async function deleteSession(
    userId : string,
){
    try {
        await redis.del(
            getSessionKey(userId)
        );
    } catch (err) {
        console.warn("Failed to delete session from Redis:", err);
    }
}

