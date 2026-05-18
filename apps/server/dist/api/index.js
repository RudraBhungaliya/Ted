import { authRoutes } from "../modules/auth/auth.route.js";
export async function registerRoutes(app) {
    app.get("/health", async () => {
        return {
            status: "ok",
        };
    });
    await app.register(authRoutes, {
        prefix: "/api/auth",
    });
}
