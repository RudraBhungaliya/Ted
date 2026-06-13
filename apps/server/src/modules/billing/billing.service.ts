import { billingRepository } from "./billing.repository.js";
import { razorpayService } from "./razorpay.service.js";

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
}

export const billingService = new BillingService();
