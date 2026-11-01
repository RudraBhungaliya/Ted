import { createSession, endSession, getSessionById, getUserSessions, getActiveSessionByUserId, } from "./service.js";
export async function createSessionController(userId, mode) {
    return await createSession(userId, mode);
}
export async function endSessionController(sessionId) {
    return await endSession(sessionId);
}
export async function getSessionController(sessionId) {
    return await getSessionById(sessionId);
}
export async function getUserSessionsController(userId) {
    return await getUserSessions(userId);
}
export async function getActiveSessionController(userId) {
    return await getActiveSessionByUserId(userId);
}
