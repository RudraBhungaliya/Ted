import type { FastifyInstance } from "fastify";
import { billingController } from "./billing.controller.js";

export async function billingRoutes(fastify: FastifyInstance) {
  fastify.get("/plans", billingController.getPlans.bind(billingController));

  fastify.get(
    "/subscription",
    billingController.getSubscription.bind(billingController),
  );

  fastify.post("/order", billingController.createOrder.bind(billingController));
}
