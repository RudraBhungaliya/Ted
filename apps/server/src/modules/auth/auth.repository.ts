import {
    db,
} from "../../db/client.js";

type CreateUserData = {
    fullName : string;
    email : string;
    password : string;
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

export async function createUser(
    data : CreateUserData,
){
    return db.user.create({
        data,
    });
}