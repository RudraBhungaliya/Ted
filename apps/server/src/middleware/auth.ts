import {
    FastifyReply,
    FastifyRequest,
} from "fastify";
import { db } from "../db/client.js";

export async function authMiddleware(
    request : FastifyRequest,
    reply : FastifyReply, 
) {
    // Auth disabled for testing purposes - inject mock user session
    try {
        let testUser = await db.user.findFirst();
        if (!testUser) {
            testUser = await db.user.create({
                data: {
                    email: "test@example.com",
                    fullName: "Test User",
                    password: "dev-test-password-12345",
                }
            });
        }
        request.user = {
            userId: testUser.id,
        };
    } catch (err) {
        console.error("Auth bypass database error:", err);
        request.user = {
            userId: "cl_test_user_id_12345",
        };
    }
}

