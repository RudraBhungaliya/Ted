import { db, } from "../../db/client.js";
export async function findUserByEmail(email) {
    return db.user.findUnique({
        where: {
            email,
        },
    });
}
export async function findUserByGoogleId(googleId) {
    return db.user.findUnique({
        where: {
            googleId,
        },
    });
}
export async function linkGoogleAccount(userId, googleId) {
    return db.user.update({
        where: {
            id: userId,
        },
        data: {
            googleId,
        },
    });
}
export async function createUser(data) {
    return db.user.create({
        data,
    });
}
