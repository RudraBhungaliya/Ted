import {
    db,
} from "../../db/client.js";

export async function createSession(userId : string){
    return await db.session.create({
        data : {
            userId,
        },
    });
}

export async function endSession(sessionId : string){
    return await db.session.update({
        where : {
            id : sessionId,
        },
        data : {
            endedAt : new Date(),
        }
    });
}