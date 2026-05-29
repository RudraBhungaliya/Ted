import type {
    FastifyInstance,
} from "fastify";

import {
    authMiddleware,
} from "../../middleware/auth.js";

import {
    createSessionController,
    endSessionController,
    getSessionController,
    getUserSessionsController,
    getActiveSessionController,
} from "./controller.js";

export async function sessionRoutes(
    app : FastifyInstance,
){

    app.post(
        "/create",

        {
            preHandler : authMiddleware,
        },

        async (request) => {

            const session =
                await createSessionController(
                    request.user!.userId,
                );

            return {
                success : true,

                session,
            };
        },
    );

    app.post(
        "/end/:sessionId",

        {
            preHandler : authMiddleware,
        },

        async (request) => {

            const {
                sessionId,
            } = request.params as {
                sessionId : string;
            };

            await endSessionController(
                sessionId,
            );

            return {
                success : true,
            };
        },
    );

    app.get(
        "/active",

        {
            preHandler : authMiddleware,
        },

        async (request) => {

            const session =
                await getActiveSessionController(
                    request.user!.userId,
                );

            return {
                success : true,

                session,
            };
        },
    );

    app.get(
        "/:sessionId",

        {
            preHandler : authMiddleware,
        },

        async (request, reply) => {

            const {
                sessionId,
            } = request.params as {
                sessionId : string;
            };

            const session =
                await getSessionController(
                    sessionId,
                );

            if (!session) {

                return reply
                    .status(404)
                    .send({

                        success : false,

                        message : "Session not found",

                    });
            }

            if (
                session.userId !==
                request.user!.userId
            ) {

                return reply
                    .status(403)
                    .send({

                        success : false,

                        message : "Forbidden",

                    });
            }

            return {
                success : true,

                session,
            };
        },
    );

    app.get(
        "/user/all",

        {
            preHandler : authMiddleware,
        },

        async (request) => {

            const sessions =
                await getUserSessionsController(
                    request.user!.userId,
                );

            return {
                success : true,

                sessions,
            };
        },
    );
}