import { FastifyInstance } from "fastify";

import { authRoutes } from "../modules/auth/auth.route.js";

export async function registerRoutes(
    app : FastifyInstance,
){
    app.get(
        "/health",
        async () => {
            return {
                status : "ok",
            };
        }
    );

    await app.register(
        authRoutes,
        {
            prefix: "/api/auth",
        }
    );
}