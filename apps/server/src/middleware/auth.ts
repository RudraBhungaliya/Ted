import {
    FastifyReply,
    FastifyRequest,
} from "fastify";

import { verifyToken } from "../lib/jwt.js";

import {
    COOKIE_NAME,
} from "../lib/cookies.js";

export async function authMiddleware(
    request : FastifyRequest,
    reply : FastifyReply, 
) {
    try{
        const token =
            request.cookies[
                COOKIE_NAME
            ];

        if (!token) {
            return reply.status(401).send({
                success : false,
                message : "Auth Header missing",
            });
        }

        const payload = verifyToken(token);
        request.user = payload;
    }
    catch(err){
        return reply.status(401).send({
            success : false,
            message  :"Invalid token",
        });
    }
}

