import { db } from "../../db/client.js";
export async function createSessionRecord(userId) {
    return db.session.create({
        data: {
            userId,
        },
    });
}
export async function completeSessionRecord(sessionId) {
    return db.session.update({
        where: {
            id: sessionId,
        },
        data: {
            endedAt: new Date(),
            status: "COMPLETED",
        },
    });
}
export async function findSessionById(sessionId) {
    return db.session.findUnique({
        where: {
            id: sessionId,
        },
        include: {
            transcripts: {
                orderBy: {
                    createdAt: "asc",
                },
            },
            aiMessages: {
                orderBy: {
                    createdAt: "asc",
                },
            },
            analytics: true,
            summary: true,
        },
    });
}
export async function findUserSessions(userId) {
    return db.session.findMany({
        where: {
            userId,
        },
        orderBy: {
            startedAt: "desc",
        },
    });
}
export async function deleteSessionRecord(userId) {
    return db.session.findFirst({
        where: {
            userId,
            status: "ACTIVE",
        },
        include: {
            transcripts: {
                orderBy: {
                    createdAt: "asc",
                },
            },
            aiMessages: {
                orderBy: {
                    createdAt: "asc",
                },
            },
            analytics: true,
            summary: true,
        },
    });
}
