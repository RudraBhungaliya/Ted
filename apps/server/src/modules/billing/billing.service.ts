import { billingRepository } from "./billing.repository.js";
import { razorpayService } from "./razorpay.service.js";
import { db } from "../../db/client.js";
import { calculateExpiryDate } from "./helpers/subscription.helper.js";

export class BillingService {
  async getPlans() {
    return billingRepository.getPlans();
  }

  async getPlanById(id: string) {
    return billingRepository.getPlanById(id);
  }

  async getSubscriptionByUserId(userId: string) {
    return billingRepository.getUserSubscription(userId);
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
    const order =
      await billingRepository.findOrderByRazorpayOrderId(razorpayOrderId);

    if (!order) {
      throw new Error("Order not found");
    }

    const expiresAt = calculateExpiryDate(order.plan.durationDays);

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
}

export const billingService = new BillingService();
