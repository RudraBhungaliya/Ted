import {
    createSession,
    endSession,
    getSessionById,
    getUserSessions,
    getActiveSessionByUserId,
} from "./service.js";

export async function createSessionController(
    userId : string,
){
    return await createSession(
        userId,
    );
}

export async function endSessionController(
    sessionId : string,
){
    return await endSession(
        sessionId,
    );
}

export async function getSessionController(
    sessionId : string,
){
    return await getSessionById(
        sessionId,
    );
}

export async function getUserSessionsController(
    userId : string,
){
    return await getUserSessions(
        userId,
    );
}

export async function getActiveSessionController(
    userId : string,
){
    return await getActiveSessionByUserId(
        userId,
    );
}