import { FastifyInstance } from "fastify";

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
}