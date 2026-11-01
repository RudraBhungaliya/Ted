import { env } from "../config/env.js";
export async function exchangeGoogleCodeForTokens(code) {
    const clientId = env.GOOGLE_CLIENT_ID || "mock-client-id";
    const clientSecret = env.GOOGLE_CLIENT_SECRET || "mock-client-secret";
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: env.GOOGLE_REDIRECT_URI,
            grant_type: "authorization_code",
        }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google token exchange failed: ${errorText}`);
    }
    return await response.json();
}
export async function getGoogleUserProfile(accessToken) {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google userinfo fetch failed: ${errorText}`);
    }
    return await response.json();
}
