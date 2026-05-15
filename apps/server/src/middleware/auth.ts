import {
    FastifyReply,
    FastifyRequest,
} from "fastify";

import { verifyToken } from "../lib/jwt.js";

export async function authMiddleware(
    request : FastifyRequest,
    reply : FastifyReply, 
) {
    try{
        const authHeader = request.headers.authorization;
        if(!authHeader){
            return reply.status(401).send({
                success : false,
                message : "Auth Header missing",
            });
        }

        const token = authHeader.split(" ")[1];

        if(!token){
            return reply.status(401).send({
                success : false,
                message : "Token missing",
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

