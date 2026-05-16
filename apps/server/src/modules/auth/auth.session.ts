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
    await redis.set(
        getSessionKey(userId),
        "active",
        "EX",
        SESSION_TTL,
    );
}

export async function validateSession(
    userId : string,
){
    const session = await redis.get(
        getSessionKey(userId),
    );
    return !!session;
}

export async function deleteSession(
    userId : string,
){
    await redis.del(
        getSessionKey(userId)
    );
}

