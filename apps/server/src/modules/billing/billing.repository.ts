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
    return db.order.findUnique({
      where: {
        razorpayOrderId,
      },
      include: {
        plan: true,
      },
    });
  }

  async hasActiveSubscription(
  userId: string,
) {
  const subscription =
    await db.subscription.findUnique({
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

  if (
    subscription.expiresAt &&
    subscription.expiresAt < new Date()
  ) {
    return false;
  }

  return true;
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

  async findPaymentByGatewayPaymentId(gatewayPaymentId: string) {
    return db.payment.findUnique({
      where: {
        gatewayPaymentId,
      },
    });
  }
}

export const billingRepository = new BillingRepository();
