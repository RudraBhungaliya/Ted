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
    verifyRefreshToken,
    generateAccessToken,
} from "../../lib/jwt.js";

import {
    ACCESS_COOKIE,
    REFRESH_COOKIE,
} from "../../lib/cookies.js";

import {
    setAuthCookies,
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

            setAuthCookies(reply, result.accessToken, result.refreshToken);

            return reply.send({
                success: true,
                data: {
                    user: result.user,
                },
            });
        }
    );

    app.post(
        "/login",
        async (request, reply) => {
            const body = validateSchema(
                loginSchema,
                request.body,
            );

            const result = await login(body);

            setAuthCookies(reply, result.accessToken, result.refreshToken);

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

    app.post(
    "/refresh",
    async (request, reply) => {

        try {

            const refreshToken =
                (request as any).cookies[
                    REFRESH_COOKIE
                ];

            if (!refreshToken) {

                return reply.status(401).send({
                    success: false,
                    message:
                        "Missing refresh token",
                });

            }

            const payload =
                verifyRefreshToken(
                    refreshToken
                );

            const accessToken =
                generateAccessToken({
                    userId:
                        payload.userId,
                });

            (reply as any).setCookie(
                ACCESS_COOKIE,
                accessToken,
                {
                    path: "/",

                    httpOnly: true,

                    secure: false,

                    sameSite: "lax",

                    maxAge: 15 * 60,
                }
            );

            return reply.send({
                success: true,
            });

        } catch {

            return reply.status(401).send({
                success: false,
                message:
                    "Invalid refresh token",
            });
        }
    }
);
}

