import { billingService } from "./billing.service.js";
import { env } from "../../config/env.js";
export class BillingController {
    async getPlans(request, reply) {
        const plans = await billingService.getPlans();
        return reply.status(200).send({
            success: true,
            data: plans,
        });
    }
    async getSubscription(request, reply) {
        const user = request.user;
        if (!user) {
            return reply.status(401).send({
                success: false,
                message: "Unauthorized",
            });
        }
        const subscription = await billingService.getSubscriptionByUserId(user.userId);
        return reply.status(200).send({
            success: true,
            data: subscription,
        });
    }
    async createOrder(request, reply) {
        const user = request.user;
        const { planId } = request.body;
        const order = await billingService.createOrder(user.userId, planId);
        return reply.status(201).send({
            success: true,
            data: order,
        });
    }
    async getConfig(request, reply) {
        return reply.status(200).send({
            success: true,
            data: {
                razorpayKeyId: env.RAZORPAY_KEY_ID,
            },
        });
    }
    async verifyPayment(request, reply) {
        const user = request.user;
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = request.body;
        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return reply.status(400).send({
                success: false,
                message: "razorpayOrderId, razorpayPaymentId, and razorpaySignature are required.",
            });
        }
        try {
            const result = await billingService.verifyPayment(user.userId, razorpayOrderId, razorpayPaymentId, razorpaySignature);
            return reply.status(200).send(result);
        }
        catch (err) {
            return reply.status(400).send({
                success: false,
                message: err instanceof Error ? err.message : "Payment verification failed",
            });
        }
    }
}
export const billingController = new BillingController();
