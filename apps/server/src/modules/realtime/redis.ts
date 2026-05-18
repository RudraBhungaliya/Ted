import Redis from "ioredis";

import {
    env,
} from "../../config/env.js";

const publisher = new (Redis as any)(
    env.REDIS_URL,
);
const subscriber = new (Redis as any)(
    env.REDIS_URL,
);

export const REDIS_CHANNELS = {
    audio : 
        "ted:audio",
    transcript : 
        "ted:transcript",
    ai : 
        "ted:ai",
} as const;

export async function publishEvent(
    channel : string,
    payload : any,
){
    await publisher.publish(
        channel,
        JSON.stringify(payload),
    );
}

export async function subscribeEvent(
    channel : string,
    handler : (
        payload : any
    ) => void,
){  
    await subscriber.subscribe(
        channel
    );

    subscriber.on(
        "message",
        (
            incomingChannel : any,
            message : any,
        ) => {
            if(
                incomingChannel !== channel
            ) return;

            handler(
                JSON.parse(message)
            );
        }
    );
}