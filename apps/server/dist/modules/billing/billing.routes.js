import { billingController } from "./billing.controller.js";
import { webhookController } from "./webhook.controller.js";
import { authMiddleware } from "../../middleware/auth.js";
export async function billingRoutes(fastify) {
    // Capture raw body for signature verification inside this plugin context
    fastify.addContentTypeParser("application/json", { parseAs: "string" }, (req, body, done) => {
        try {
            const bodyStr = typeof body === "string" ? body : body.toString("utf8");
            req.rawBody = bodyStr;
            const json = JSON.parse(bodyStr);
            done(null, json);
        }
        catch (err) {
            done(err, undefined);
        }
    });
    fastify.get("/plans", billingController.getPlans.bind(billingController));
    fastify.get("/subscription", {
        preHandler: authMiddleware,
    }, billingController.getSubscription.bind(billingController));
    fastify.get("/config", billingController.getConfig.bind(billingController));
    fastify.post("/order", {
        preHandler: authMiddleware,
    }, billingController.createOrder.bind(billingController));
    fastify.post("/verify", {
        preHandler: authMiddleware,
    }, billingController.verifyPayment.bind(billingController));
    fastify.post("/webhook", webhookController.razorpayWebhook.bind(webhookController));
}
