import {
    FastifyInstance,// router instance
} from "fastify";

import {
    signupSchema,
    loginSchema,
} from "./auth.schema.js";

import {
    signup,
    login,
} from "./auth.service.js";

import {
    validateSchema,
} from "../../utils/validate.js";

import {
    setAuthCookie,
    clearAuthCookie,
} from "../../lib/cookies.js";

import {
    authMiddleware,
} from "../../middleware/auth.js";

export async function authRoutes(
    app : FastifyInstance,
){
    app.post(
        "/signup",
        async (request, reply) => {
            const body = validateSchema(
                signupSchema,
                request.body,
            );

            const result = await signup(body);

            setAuthCookie(
                reply,
                result.token,
            );

            return reply.send({
                success: true,
                data: {
                    user: result.user,
                },
            });
        }
    );

    app.post(
        "login",
        async (request, reply) => {
            const body = validateSchema(
                loginSchema,
                request.body,
            );

            const result = await login(body);

            setAuthCookie(
                reply,
                result.token,
            );

            return reply.send({
                success: true,
                data: {
                    user: result.user,
                },
            });
        }
    );

    app.post(
        "/logout",
        async (_, reply) => {

            clearAuthCookie(
                reply
            );

            return reply.send({
                success: true,
            });

        }
    );

    app.get(
        "/me",
        {
            preHandler: authMiddleware,
        },
        async (request, reply) => {

            return reply.send({
                success: true,
                data: request.user,
            });

        }
    );
}

