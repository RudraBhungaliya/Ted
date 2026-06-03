import { db } from "../../db/client.js";

export async function createSessionRecord(userId: string) {
  return db.session.create({
    data: {
      userId,
    },
  });
}

export async function completeSessionRecord(sessionId: string) {
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

export async function findSessionById(sessionId: string) {
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

      analytics: {
        orderBy: {
          createdAt: "asc",
        },
      },

      summary: true,
    },
  });
}

export async function findUserSessions(
    userId : string
){
    return db.session.findMany({
        where : {
            userId,
        },

        orderBy : {
            startedAt : "desc",
        },
    });
}

export async function deleteSessionRecord(userId : string){
    return db.session.findFirst({
        where : {
            userId,
            status : "ACTIVE",
        },

        include : {
            transcripts : {
                orderBy : {
                    createdAt : "asc",
                },
            },

            aiMessages : {
                orderBy : {
                    createdAt : "asc",
                },
            },

            analytics : {
                orderBy : {
                    createdAt : "asc",
                },
            },

            summary : true,
        },
    });
}
