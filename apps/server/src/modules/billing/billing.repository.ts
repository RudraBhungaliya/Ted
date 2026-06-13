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

    async getPlanById(planId: string) {
        return db.subscriptionPlanConfig.findUnique({
            where: {
                id: planId,
            },
        });
    }

    async createOrder(data: {
        userId: string;
        planId: string;
        amount: number;
        currency: string;
        razorpayOrderId: string;
    }) {
        return db.order.create({
            data,
        });
    }

    async findOrderById(orderId: string) {
        return db.order.findUnique({
            where: {
                id: orderId,
            },
        });
    }

    async findOrderByRazorpayOrderId(razorpayOrderId: string) {
        return db.order.findFirst({
            where: {
                razorpayOrderId,
            },
            include: {
                plan: true,
            },
        });
    }

    async getUserSubscription(userId: string) {
        return db.subscription.findUnique({
            where: {
                userId,
            },
            include: {
                plan: true,
            },
        });
    }
}

export const billingRepository = new BillingRepository();