import { razorpay } from "../../config/razorpay.js";
export class RazorpayService {
    async createOrder(amount, currency) {
        return razorpay.orders.create({
            amount,
            currency,
        });
    }
}
export const razorpayService = new RazorpayService();
