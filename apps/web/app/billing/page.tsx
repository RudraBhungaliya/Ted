"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  AlertCircle,
  CreditCard,
  Clock,
  Calendar,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import { billingApi } from "../lib/api/endpoints";

type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  razorpayPlanId: string | null;
  active: boolean;
};

type Subscription = {
  id: string;
  userId: string;
  planId: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  startedAt: string;
  expiresAt: string | null;
  plan: Plan;
};

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadBillingData() {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
          "http://localhost:4000";
        const authResponse = await fetch(`${apiUrl}/api/auth/me`, {
          credentials: "include",
        });
        if (!authResponse.ok) {
          router.push("/login");
          return;
        }
        const authData = await authResponse.json();
        if (authData.success && authData.data) {
          setUser(authData.data);
        } else {
          router.push("/login");
          return;
        }

        try {
          const configRes = await billingApi.getConfig();
          if (configRes.success && configRes.data) {
            setRazorpayKeyId(configRes.data.razorpayKeyId);
          }
        } catch (err) {
          console.error("Failed to load Razorpay config:", err);
        }

        try {
          const subRes = await billingApi.getSubscription();
          if (subRes.success && subRes.data) {
            setSubscription(subRes.data);
          }
        } catch (err) {
          console.error("Failed to load subscription:", err);
        }

        try {
          const plansRes = await billingApi.getPlans();
          if (plansRes.success && plansRes.data) {
            setPlans(plansRes.data);
          }
        } catch (err) {
          console.error("Failed to load plans:", err);
        }
      } catch (err) {
        console.error("Critical billing load failure:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadBillingData();
  }, [router]);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as any).Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (planId: string) => {
    setMessage(null);
    setPaymentLoading(planId);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      const orderRes = await billingApi.createOrder(planId);
      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.message || "Failed to initiate payment order.");
      }

      const { orderId, amount, currency } = orderRes.data;

      const options = {
        key: razorpayKeyId || "rzp_test_placeholder_key_id",
        amount: amount * 100,
        currency,
        name: "Ted Assistant",
        description: "Ted Premium Plan Subscription",
        order_id: orderId,
        handler: async (response: any) => {
          try {
            setPaymentLoading(planId);
            const verifyRes = await billingApi.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              setMessage({
                type: "success",
                text: "Thank you! Your subscription is now active.",
              });
              const subRes = await billingApi.getSubscription();
              if (subRes.success && subRes.data) {
                setSubscription(subRes.data);
              }
            } else {
              setMessage({
                type: "error",
                text: verifyRes.message || "Payment signature verification failed.",
              });
            }
          } catch (err: any) {
            setMessage({
              type: "error",
              text: err?.message || "Verification failed after checkout.",
            });
          } finally {
            setPaymentLoading(null);
          }
        },
        prefill: {
          name: user?.fullName || "",
          email: user?.email || "",
        },
        theme: {
          color: "#1c1917",
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on("payment.failed", (response: any) => {
        setMessage({
          type: "error",
          text: response.error?.description || "Payment was declined or cancelled.",
        });
        setPaymentLoading(null);
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: "error",
        text: err?.message || "Failed to process payment checkout.",
      });
      setPaymentLoading(null);
    }
  };

  const getDaysRemaining = (expiresAt: string | null): number => {
    if (!expiresAt) return 0;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const isPremiumActive =
    subscription?.status === "ACTIVE" &&
    (!subscription.expiresAt || new Date(subscription.expiresAt).getTime() > Date.now());

  const currentPlanId = isPremiumActive ? subscription?.planId : null;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] text-stone-900 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-sm font-medium">
            Loading membership plans...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans selection:bg-amber-200 pb-20">
      <Navbar user={user} />

      <div className="max-w-4xl mx-auto px-6 pt-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            Membership & Plans
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Choose the membership tier that fits your meeting load and interview prep schedule.
          </p>
        </div>

        {/* Status Notification Message */}
        {message && (
          <div
            className={`p-4 rounded-2xl border mb-6 flex items-start gap-3 shadow-2xs ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {message.type === "success" ? (
              <Check className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            )}
            <div>
              <p className="text-sm font-bold">
                {message.type === "success" ? "Success" : "Payment Notice"}
              </p>
              <p className="text-xs mt-0.5 font-medium leading-relaxed">
                {message.text}
              </p>
            </div>
          </div>
        )}

        {/* Current Plan Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-stone-100 gap-4">
            <div>
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                Your Current Status
              </span>
              <h2 className="text-2xl font-bold text-stone-900">
                {isPremiumActive ? subscription?.plan.name : "Free Starter Plan"}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                {isPremiumActive
                  ? "All premium capabilities, screen capture, and unlimited recording are active."
                  : "You are currently on the free starter plan with basic session access."}
              </p>
            </div>

            <div>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  isPremiumActive
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-stone-100 text-stone-700 border-stone-200"
                }`}
              >
                {isPremiumActive ? "Active Member" : "Free Plan"}
              </span>
            </div>
          </div>

          {isPremiumActive && subscription && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 shadow-2xs">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-semibold uppercase block">
                    Plan Cost
                  </span>
                  <span className="text-sm font-bold text-stone-900">
                    ₹{subscription.plan.price} /{" "}
                    {subscription.plan.durationDays === 365 ? "year" : "month"}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 shadow-2xs">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-semibold uppercase block">
                    Valid Through
                  </span>
                  <span className="text-sm font-bold text-stone-900">
                    {subscription.expiresAt
                      ? new Date(subscription.expiresAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Lifetime"}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 shadow-2xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-semibold uppercase block">
                    Remaining
                  </span>
                  <span className="text-sm font-bold text-stone-900">
                    {getDaysRemaining(subscription.expiresAt)} days
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-stone-900 tracking-tight">
            Available Plans
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Straightforward pricing. No surprise fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const isYearly = plan.durationDays === 365;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl p-6 sm:p-8 border transition-all flex flex-col justify-between relative ${
                  isYearly
                    ? "border-stone-900 shadow-md ring-1 ring-stone-900/5"
                    : "border-stone-200/90 shadow-xs hover:border-stone-300"
                }`}
              >
                {isYearly && (
                  <span className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-bold bg-stone-900 text-white uppercase tracking-wider shadow-xs">
                    Recommended • Save ~65%
                  </span>
                )}

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-stone-900">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {plan.durationDays} days of uninterrupted access
                      </p>
                    </div>

                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        Current Plan
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1.5 mb-6 pb-6 border-b border-stone-100">
                    <span className="text-3xl font-extrabold text-stone-900">
                      ₹{plan.price}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">
                      / {isYearly ? "year" : "month"}
                    </span>
                  </div>

                  {/* Checklist */}
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2.5 text-xs text-stone-700">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Unlimited real-time speech transcription</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-stone-700">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Live speaking suggestions for technical interviews</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-stone-700">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Always-on-top desktop overlay with screen assist</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-stone-700">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Automatic meeting summaries & action item extraction</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-stone-700">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Full searchable session archive & speech metrics</span>
                    </li>
                  </ul>
                </div>

                <button
                  disabled={isCurrent || paymentLoading !== null}
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full py-3.5 rounded-2xl font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                    isCurrent
                      ? "bg-stone-100 text-stone-500 border border-stone-200 cursor-default"
                      : isYearly
                      ? "bg-stone-900 hover:bg-stone-800 text-white active:scale-[0.99]"
                      : "bg-white hover:bg-stone-50 text-stone-900 border border-stone-300 active:scale-[0.99]"
                  }`}
                >
                  {paymentLoading === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-stone-700" />
                      <span>Opening Secure Checkout...</span>
                    </>
                  ) : isCurrent ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Current Active Plan</span>
                    </>
                  ) : isPremiumActive ? (
                    <span>Switch to this Plan</span>
                  ) : (
                    <span>Upgrade to {plan.name}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Security guarantee */}
        <div className="mt-12 text-center flex items-center justify-center gap-2 text-xs text-stone-400">
          <ShieldCheck className="w-4 h-4 text-stone-500" />
          <span>Encrypted payment processing via Razorpay. Cancel anytime without penalty.</span>
        </div>
      </div>
    </main>
  );
}
