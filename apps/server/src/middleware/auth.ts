import {
    FastifyReply,
    FastifyRequest,
} from "fastify";
import { db } from "../db/client.js";
import { verifyToken } from "../lib/jwt.js";
import { ACCESS_COOKIE } from "../lib/cookies.js";
import { UnauthorizedError } from "../utils/error.js";

export async function authMiddleware(
    request : FastifyRequest,
    reply : FastifyReply, 
) {
    const accessToken = request.cookies[ACCESS_COOKIE];
    if (!accessToken) {
        throw new UnauthorizedError("Unauthorized: Missing access token");
    }

    try {
        const payload = verifyToken(accessToken);
        
        const user = await db.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                email: true,
                fullName: true,
            },
        });

        if (!user) {
            throw new UnauthorizedError("Unauthorized: User not found");
        }

        request.user = {
            userId: user.id,
            email: user.email,
            fullName: user.fullName || undefined,
        };
    } catch (err) {
        throw new UnauthorizedError("Unauthorized: Invalid access token");
    }
}

