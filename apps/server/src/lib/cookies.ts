import { FastifyReply } from "fastify";
const ACCESS_COOKIE = "ted_access_token";
const REFRESH_COOKIE = "ted_refresh_token";

export function setAuthCookies(
    reply: FastifyReply,
    accessToken: string,
    refreshToken: string,
){
    (reply as any).setCookie(ACCESS_COOKIE, accessToken, {
        path : "/",
        httpOnly : true,
        secure : false,
        sameSite : "lax",
        maxAge : 7 * 24 * 60 * 60, // week
    })

    (reply as any).setCookie(
        REFRESH_COOKIE,
        refreshToken,
        {
            path: "/",
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60,
        }
    );
}

export function clearAuthCookie(reply : FastifyReply){
    (reply as any).clearCookie(
        ACCESS_COOKIE,
        {
            path: "/",
        }
    );

    (reply as any).clearCookie(
        REFRESH_COOKIE,
        {
            path: "/",
        }
    );
}

export {
    ACCESS_COOKIE,
    REFRESH_COOKIE,
};