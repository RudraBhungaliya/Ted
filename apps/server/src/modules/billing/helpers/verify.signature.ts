import crypto from "crypto";
import { env } from "../../../config/env.js";

export function verifyWebhookSignature(body: string, signature: string) {
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
) {
  const text = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(text)
    .digest("hex");

  return expectedSignature === signature;
}
