import { billingRepository } from "./billing.repository.js";

export class BillingService {
    async getPlans() {
        return billingRepository.getPlans();
    }

    async getPlanById (id : string){
        return billingRepository.getPlanById(id);
    }

    async getSubscriptionByUserId (userId : string){
        return billingRepository.getUserSubscription(userId);
    }
}

export const billingService = new BillingService();