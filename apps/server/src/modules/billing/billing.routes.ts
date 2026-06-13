import type { FastifyInstance } from "fastify";
import { billingController } from "./billing.controller.js";
import { webhookController } from "./validators/webhook.validator.js";

export async function billingRoutes(fastify: FastifyInstance) {
  fastify.get("/plans", billingController.getPlans.bind(billingController));

  fastify.get(
    "/subscription",
    billingController.getSubscription.bind(billingController),
  );

  fastify.post("/order", billingController.createOrder.bind(billingController));

  fastify.post(
    "/webhook",
    webhookController.razorpayWebhook.bind(webhookController),
  );
}
