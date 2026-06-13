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

  async createPayment(data: {
    userId: string;
    orderId: string;
    gateway: string;
    gatewayPaymentId: string;
    amount: number;
    currency: string;
    status: "SUCCESS";
    payload: string;
  }) {
    return db.payment.create({
      data,
    });
  }

  async updateOrderStatus(orderId: string) {
    return db.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: "PAID",
      },
    });
  }

  async createOrUpdateSubscription(
    userId: string,
    planId: string,
    expiresAt: Date,
  ) {
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
}

export const billingRepository = new BillingRepository();
