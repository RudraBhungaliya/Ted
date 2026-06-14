import type { FastifyReply, FastifyRequest } from "fastify";

import { billingService } from "./billing.service.js";
import { verifyWebhookSignature } from "./helpers/verify.signature.js";

export class WebhookController {
  async razorpayWebhook(request: FastifyRequest, reply: FastifyReply) {
    const signature = request.headers["x-razorpay-signature"] as string;

    const body = (request as any).rawBody || JSON.stringify(request.body);

    const verified = verifyWebhookSignature(body, signature);

    if (!verified) {
      return reply.status(401).send({
        success: false,
        message: "Invalid signature",
      });
    }

    const payload = request.body as any;

    if (payload.event === "payment.captured") {
      await billingService.activateSubscription(
        payload.payload.payment.entity.order_id,
        payload.payload.payment.entity.id,
        payload,
      );
    }

    return reply.send({
      success: true,
    });
  }
}

export const webhookController = new WebhookController();
