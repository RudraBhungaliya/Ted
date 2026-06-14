import { apiClient } from "./client";

// Auth endpoints
export const authApi = {
  signup: (data: { email: string; password: string; name: string }) =>
    apiClient.post("/auth/signup", data),
  login: (data: { email: string; password: string }) =>
    apiClient.post("/auth/login", data),
  logout: () => apiClient.post("/auth/logout"),
};

export const billingApi = {
  getPlans: () => apiClient.get<any>("/billing/plans"),

  getSubscription: () => apiClient.get<any>("/billing/subscription"),

  createOrder: (planId: string) =>
    apiClient.post<any>("/billing/order", {
      planId,
    }),

  getConfig: () => apiClient.get<any>("/billing/config"),

  verifyPayment: (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => apiClient.post<any>("/billing/verify", data),
};

// Audio endpoints
export const audioApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("audio", file);
    return fetch(`${process.env.NEXT_PUBLIC_API_URL}/audio/upload`, {
      method: "POST",
      body: formData,
    });
  },
  process: (file: File) => {
    const formData = new FormData();
    formData.append("audio", file);
    return fetch(`${process.env.NEXT_PUBLIC_API_URL}/audio/process`, {
      method: "POST",
      body: formData,
    });
  },
};

// Stream endpoints
export const streamApi = {
  connect: () => new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/stream`),
};
