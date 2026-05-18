const ACCESS_COOKIE = "ted_access_token";
const REFRESH_COOKIE = "ted_refresh_token";
export function setAuthCookies(reply, accessToken, refreshToken) {
    reply.setCookie(ACCESS_COOKIE, accessToken, {
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // week
    })(reply).setCookie(REFRESH_COOKIE, refreshToken, {
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
    });
}
export function clearAuthCookie(reply) {
    reply.clearCookie(ACCESS_COOKIE, {
        path: "/",
    });
    reply.clearCookie(REFRESH_COOKIE, {
        path: "/",
    });
}
export { ACCESS_COOKIE, REFRESH_COOKIE, };
