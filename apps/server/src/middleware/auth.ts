import {
    FastifyReply,
    FastifyRequest,
} from "fastify";

import { verifyToken } from "../lib/jwt.js";

import {
    ACCESS_COOKIE,
} from "../lib/cookies.js";

export async function authMiddleware(
    request : FastifyRequest,
    reply : FastifyReply, 
) {
    try{
        const token = (request as any).cookies[ACCESS_COOKIE];

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

