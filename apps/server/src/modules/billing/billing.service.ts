import { billingRepository } from "./billing.repository.js";
import { razorpayService } from "./razorpay.service.js";
import { db } from "../../db/client.js";
import { calculateExpiryDate } from "./helpers/subscription.helper.js";
import { verifyPaymentSignature } from "./helpers/verify.signature.js";

export class BillingService {
  async getPlans() {
    let plans = await billingRepository.getPlans();
    
    // Seed default plans if none exist in the database
    if (plans.length === 0) {
      await db.subscriptionPlanConfig.createMany({
        data: [
          {
            id: "monthly-premium",
            name: "Monthly Premium",
            price: 499,
            currency: "INR",
            durationDays: 30,
            active: true,
          },
          {
            id: "yearly-premium",
            name: "Yearly Premium",
            price: 1999,
            currency: "INR",
            durationDays: 365,
            active: true,
          },
        ],
      });
      plans = await billingRepository.getPlans();
    }
    
    return plans;
  }

  async getPlanById(id: string) {
    return billingRepository.getPlanById(id);
  }

  async getSubscriptionByUserId(userId: string) {
    const subscription = await billingRepository.getUserSubscription(userId);
    
    if (subscription) {
      // Dynamic expiration check
      if (
        subscription.status === "ACTIVE" &&
        subscription.expiresAt &&
        subscription.expiresAt < new Date()
      ) {
        await db.subscription.update({
          where: { id: subscription.id },
          data: { status: "EXPIRED" },
        });
        subscription.status = "EXPIRED";
      }
    }
    
    return subscription;
  }

  async createOrder(userId: string, planId: string) {
    const plan = await this.getPlanById(planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    const razorpayOrder = await razorpayService.createOrder(
      plan.price * 100,
      plan.currency,
    );

    return billingRepository.createOrder({
      userId,
      planId,
      amount: plan.price,
      currency: plan.currency,
      razorpayOrderId: razorpayOrder.id,
    });
  }

  async activateSubscription(
    razorpayOrderId: string,
    paymentId: string,
    payload: unknown,
  ) {
    const existingPayment =
      await billingRepository.findPaymentByGatewayPaymentId(paymentId);

    if (existingPayment) {
      return;
    }

    const order =
      await billingRepository.findOrderByRazorpayOrderId(razorpayOrderId);

    if (!order) {
      throw new Error("Order not found");
    }

    const baseExpiresAt = calculateExpiryDate(order.plan.durationDays);

    return db.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          gateway: "RAZORPAY",
          gatewayPaymentId: paymentId,
          amount: order.amount,
          currency: order.currency,
          status: "SUCCESS",
          payload: payload as any,
        },
      });

      await tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: "PAID",
        },
      });

      // Retrieve existing subscription to check if it's active and has remaining time
      const existingSub = await tx.subscription.findUnique({
        where: {
          userId: order.userId,
        },
      });

      let expiresAt = baseExpiresAt;
      if (
        existingSub &&
        existingSub.expiresAt &&
        existingSub.expiresAt > new Date() &&
        existingSub.status === "ACTIVE"
      ) {
        // Extend subscription duration by adding remaining time
        const remainingTime = existingSub.expiresAt.getTime() - Date.now();
        expiresAt = new Date(baseExpiresAt.getTime() + remainingTime);
      }

      await tx.subscription.upsert({
        where: {
          userId: order.userId,
        },
        update: {
          planId: order.planId,
          status: "ACTIVE",
          expiresAt,
        },
        create: {
          userId: order.userId,
          planId: order.planId,
          status: "ACTIVE",
          expiresAt,
        },
      });
    });
  }

  async verifyPayment(
    userId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const verified = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );

    if (!verified) {
      throw new Error("Invalid payment signature");
    }

    await this.activateSubscription(razorpayOrderId, razorpayPaymentId, {
      verification: "client_direct",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    return { success: true };
  }
}

export const billingService = new BillingService();
