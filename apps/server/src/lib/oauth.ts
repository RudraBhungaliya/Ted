import { env } from "../config/env.js";

export async function exchangeGoogleCodeForTokens(code: string) {
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

  return await response.json() as {
    access_token: string;
    id_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    token_type: string;
  };
}

export async function getGoogleUserProfile(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google userinfo fetch failed: ${errorText}`);
  }

  return await response.json() as {
    sub: string;
    name: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    email: string;
    email_verified: boolean;
  };
}
