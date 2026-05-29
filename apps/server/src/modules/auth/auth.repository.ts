import {
    db,
} from "../../db/client.js";

type CreateUserData = {
    fullName : string;
    email : string;
    password? : string;
    googleId? : string;
};

export async function findUserByEmail(
    email : string,
){
    return db.user.findUnique({
        where : {
            email,
        },
    });
}

export async function findUserByGoogleId(
    googleId : string,
){
    return db.user.findUnique({
        where : {
            googleId,
        },
    });
}

export async function linkGoogleAccount(
    userId : string,
    googleId : string,
){
    return db.user.update({
        where : {
            id : userId,
        },
        data : {
            googleId,
        },
    });
}

export async function createUser(
    data : CreateUserData,
){
    return db.user.create({
        data,
    });
}