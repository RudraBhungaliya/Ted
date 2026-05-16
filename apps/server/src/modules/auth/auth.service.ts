import { randomUUID } from "crypto";

import {
    createUser,
    findUserByEmail,
} from "./auth.repository.js";

import {
    hashPassword,
    comparePassword,
} from "../../lib/hash.js";

import {
    generateToken,
} from "../../lib/jwt.js";

import {
    BadRequestError,
    UnauthorizedError,
} from "../../utils/error.js";

type SignupData = {
    name : string;
    email : string;
    password : string;
};

type LoginData = {
    email : string;
    password : string;
}

export async function signup(
    data : SignupData,
){
    const existingUser = await findUserByEmail(data.email);

    if(existingUser){
        throw new BadRequestError("Email already in use");
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await createUser({
        id : randomUUID(),
        name : data.name,
        email : data.email,
        password : hashedPassword,
    });

    const token = generateToken({
        userId : user.id,
    });

    return {
        token,
        user,
    };
}

export async function login(
    data : LoginData,
){
    const user = await findUserByEmail(data.email);

    if(!user){
        throw new UnauthorizedError("Invalid email or password");
    }

    const validPassword = await comparePassword(
        data.password,
        user.password,
    );

    if(!validPassword){
        throw new UnauthorizedError("Invalid email or password");
    }

    const token = generateToken({
        userId : user.id,
    });

    return {
        token,
        user,
    };
}

