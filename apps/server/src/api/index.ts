import type {
    FastifyInstance,
} from "fastify";

import {
    authRoutes,
} from "../modules/auth/auth.route.js";

import {
    realtimeGateway,
} from "../modules/realtime/gateway.js";

export async function registerRoutes(
    app: FastifyInstance,
) {

    app.get(
        "/health",

        async () => {

            return {

                status: "ok",

            };

        },
    );

    await app.register(

        authRoutes,

        {

            prefix: "/api/auth",

        },

    );

    await realtimeGateway(
        app,
    );

}