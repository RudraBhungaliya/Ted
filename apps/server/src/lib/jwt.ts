import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

type JwtPayload = {// for ts for type specifying
    userId : string;
    email : string;
};

export function generateAccessToken(
    payload : JwtPayload,
) {
    return jwt.sign(
        payload,
        env.JWT_SECRET,
        {
            expiresIn : "7d",
        }
    );
}

export function generateRefreshToken(
    payload : JwtPayload,
){
    return jwt.sign(
        payload,
        process.env.JWT_SECRET!,
        {
            expiresIn : "30d",
        },
    );
}

export function verifyRefreshToken(
    token : string,
) {
    return jwt.verify(
        token,
        env.JWT_SECRET,
    ) as JwtPayload;
}

export function verifyToken(
    token : string,
) {
    return jwt.verify(
        token,
        env.JWT_SECRET,
    ) as JwtPayload;
}

