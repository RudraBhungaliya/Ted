import type {
    FastifyReply,
    FastifyRequest,
} from "fastify";

import { billingService } from "./billing.service.js";

export class BillingController {
    async getPlans(
        request : FastifyRequest,
        reply : FastifyReply,
    ){
        const plans = await billingService.getPlans();
        return reply.status(200).send({
            success : true,
            data : plans,
        });
    }

    async getSubscription(
        request : FastifyRequest,
        reply : FastifyReply,
    ){
        const user = request.user as {
            userId : string;
        };

        if (!user) {
            return reply.status(401).send({
                success : false,
                message : "Unauthorized",
            });
        }

        const subscription = await billingService.getSubscriptionByUserId(user.userId);

        return reply.status(200).send({
            success : true,
            data : subscription,
        });
    }
}

export const billingController = new BillingController();