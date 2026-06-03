import { db } from "../../db/client.js";

export async function createTranscript(
    data : {
        sessionId : string;
        speakerName : string;
        speakerType : "USER" | "AI" | "PARTICIPANT";
        text : string;
    }
){
    return db.transcript.create({
        data,
    });
}

export async function getSessionTranscripts(
    sessionId : string,
){
    return db.transcript.findMany({
        where : {
            sessionId,
        },

        orderBy : {
            createdAt : "asc",
        },
    });
}

