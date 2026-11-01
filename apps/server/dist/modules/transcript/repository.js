import { db } from "../../db/client.js";
export async function createTranscript(data) {
    return db.transcript.create({
        data,
    });
}
export async function getSessionTranscripts(sessionId) {
    return db.transcript.findMany({
        where: {
            sessionId,
        },
        orderBy: {
            createdAt: "asc",
        },
    });
}
