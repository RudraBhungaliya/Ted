import {
    createUser,
    findUserByEmail,
} from "./auth.repository.js";

import {
    hashPassword,
    comparePassword,
} from "../../lib/hash.js";

import {
    generateAccessToken,
    generateRefreshToken,
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
};

export async function signup(
    data : SignupData,
){
    const existingUser = await findUserByEmail(data.email);

    if(existingUser){
        throw new BadRequestError("Email already in use");
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await createUser({
        fullName : data.name,
        email : data.email,
        password : hashedPassword,
    });

    const accessToken = generateAccessToken({
        userId : user.id,
        email : user.email,
    });

    const refreshToken = generateRefreshToken({
        userId : user.id,
        email : user.email,
    });

    return {
        accessToken,
        refreshToken,
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

    const accessToken = generateAccessToken({
        userId : user.id,
        email : user.email,
    });

    const refreshToken = generateRefreshToken({
        userId : user.id,
        email : user.email,
    });

    return {
        accessToken,
        refreshToken,
        user,
    };
}

