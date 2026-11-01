import { db } from "../../db/client.js";
export class BillingRepository {
    async getPlans() {
        return db.subscriptionPlanConfig.findMany({
            where: {
                active: true,
            },
            orderBy: {
                price: "asc",
            },
        });
    }
    async getPlanById(planId) {
        return db.subscriptionPlanConfig.findUnique({
            where: {
                id: planId,
            },
        });
    }
    async createOrder(data) {
        return db.order.create({
            data,
        });
    }
    async findOrderById(orderId) {
        return db.order.findUnique({
            where: {
                id: orderId,
            },
        });
    }
    async findOrderByRazorpayOrderId(razorpayOrderId) {
        return db.order.findUnique({
            where: {
                razorpayOrderId,
            },
            include: {
                plan: true,
            },
        });
    }
    async hasActiveSubscription(userId) {
        const subscription = await db.subscription.findUnique({
            where: {
                userId,
            },
            include: {
                plan: true,
            },
        });
        if (!subscription) {
            return false;
        }
        if (subscription.status !== "ACTIVE") {
            return false;
        }
        if (subscription.expiresAt &&
            subscription.expiresAt < new Date()) {
            return false;
        }
        return true;
    }
    async getUserSubscription(userId) {
        return db.subscription.findUnique({
            where: {
                userId,
            },
            include: {
                plan: true,
            },
        });
    }
    async createPayment(data) {
        return db.payment.create({
            data,
        });
    }
    async updateOrderStatus(orderId) {
        return db.order.update({
            where: {
                id: orderId,
            },
            data: {
                status: "PAID",
            },
        });
    }
    async createOrUpdateSubscription(userId, planId, expiresAt) {
        const existing = await db.subscription.findUnique({
            where: {
                userId,
            },
        });
        if (existing && existing.expiresAt && existing.expiresAt > new Date()) {
            const remainingTime = existing.expiresAt.getTime() - Date.now();
            expiresAt = new Date(expiresAt.getTime() + remainingTime);
        }
        return db.subscription.upsert({
            where: {
                userId,
            },
            update: {
                planId,
                status: "ACTIVE",
                expiresAt,
            },
            create: {
                userId,
                planId,
                status: "ACTIVE",
                expiresAt,
            },
        });
    }
    async findPaymentByGatewayPaymentId(gatewayPaymentId) {
        return db.payment.findUnique({
            where: {
                gatewayPaymentId,
            },
        });
    }
}
export const billingRepository = new BillingRepository();
