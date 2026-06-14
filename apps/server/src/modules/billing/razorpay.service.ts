import { razorpay } from "../../config/razorpay.js";

export class RazorpayService {
    async createOrder(amount : number, currency : string){
        return razorpay.orders.create({
            amount,
            currency,
        });
    }
}

export const razorpayService = new RazorpayService();