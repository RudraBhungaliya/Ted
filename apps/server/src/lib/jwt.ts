import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

type JwtPayload = {// for ts for type specifying
    userId : string;
};

export function generateToken(
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

export function verifyToken(
    token : string,
) {
    return jwt.verify(
        token,
        env.JWT_SECRET,
    ) as JwtPayload;
}

