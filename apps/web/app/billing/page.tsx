"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Check,
  AlertCircle,
  CreditCard,
  Sparkles,
  Clock,
  Calendar,
  ArrowLeft,
  Loader2,
  Award,
} from "lucide-react";
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
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null); // contains planId being purchased
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadBillingData() {
      try {
        // 1. Check Auth & Load User
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

        // 2. Fetch Config (Razorpay Public Key ID)
        try {
          const configRes = await billingApi.getConfig();
          if (configRes.success && configRes.data) {
            setRazorpayKeyId(configRes.data.razorpayKeyId);
          }
        } catch (err) {
          console.error("Failed to load Razorpay config:", err);
        }

        // 3. Fetch Subscription
        try {
          const subRes = await billingApi.getSubscription();
          if (subRes.success && subRes.data) {
            setSubscription(subRes.data);
          }
        } catch (err) {
          console.error("Failed to load subscription:", err);
        }

        // 4. Fetch Available Plans
        try {
          const plansRes = await billingApi.getPlans();
          if (plansRes.success && plansRes.data) {
            setPlans(plansRes.data);
          }
        } catch (err) {
          console.error("Failed to load plans:", err);
        }
      } catch (err) {
        console.error("General loading error:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadBillingData();
  }, [router]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (planId: string) => {
    setPaymentLoading(planId);
    setMessage(null);

    try {
      // 1. Create Razorpay order on backend
      const orderRes = await billingApi.createOrder(planId);
      if (!orderRes.success || !orderRes.data) {
        throw new Error("Failed to initialize billing order.");
      }

      const orderData = orderRes.data;

      // 2. Load Razorpay Checkout Script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your connection.");
      }

      if (!razorpayKeyId) {
        throw new Error("Razorpay Key ID not configured. Please add it to server environment.");
      }

      // 3. Launch Razorpay Checkout Modal
      const options = {
        key: razorpayKeyId,
        amount: orderData.amount * 100, // Amount is in currency subunits (paise)
        currency: orderData.currency,
        name: "Ted Intelligence",
        description: `Upgrade subscription to ${planId === "monthly-premium" ? "Monthly Premium" : "Yearly Premium"}`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: user?.fullName || "",
          email: user?.email || "",
        },
        theme: {
          color: "#4f46e5", // Indigo color corresponding to Ted theme
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(null);
          },
        },
        handler: async function (response: any) {
          setPaymentLoading(planId);
          try {
            // 4. Verify payment immediately on frontend callback
            const verifyRes = await billingApi.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              setMessage({
                type: "success",
                text: "Thank you! Your premium subscription is now active.",
              });

              // Refresh subscription info
              const subUpdate = await billingApi.getSubscription();
              if (subUpdate.success && subUpdate.data) {
                setSubscription(subUpdate.data);
              }
            } else {
              throw new Error("Verification response failed.");
            }
          } catch (err: any) {
            setMessage({
              type: "error",
              text: err.message || "Payment verification failed. Please contact support.",
            });
          } finally {
            setPaymentLoading(null);
          }
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Something went wrong initiating checkout.",
      });
      setPaymentLoading(null);
    }
  };

  const getDaysRemaining = (expiryDateStr: string | null) => {
    if (!expiryDateStr) return 0;
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#090D1A] text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm font-medium">
            Fetching billing profile & secure configurations...
          </p>
        </div>
      </main>
    );
  }

  const isPremiumActive = subscription && subscription.status === "ACTIVE" && getDaysRemaining(subscription.expiresAt) > 0;
  const currentPlanId = isPremiumActive ? subscription?.planId : null;

  return (
    <main className="min-h-screen bg-[#090D1A] text-zinc-100 font-sans relative overflow-hidden pb-20">
      {/* Glow Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-20 border-b border-white/[0.06] bg-neutral-950/20 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
            <Zap className="text-white w-4 h-4 fill-white/10" />
          </div>
          <span className="font-bold text-lg text-white">Ted Intelligence</span>
        </div>
        <div className="flex items-center gap-6 font-medium">
          <a
            href="/"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Interview
          </a>
          <a
            href="/history"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            History
          </a>
          <a
            href="/dashboard"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Dashboard
          </a>
          <a
            href="/billing"
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Billing
          </a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-12 relative z-10">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white font-semibold transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Workspace
        </button>

        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          Billing & Subscriptions
        </h1>
        <p className="text-sm text-zinc-400 mb-8">
          Manage your account plans, billing details, and premium workspace access.
        </p>

        {/* Message Alert */}
        {message && (
          <div
            className={`p-4 rounded-xl border mb-8 flex items-start gap-3 shadow-md ${
              message.type === "success"
                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/5 border-red-500/20 text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <Check className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-semibold">
                {message.type === "success" ? "Success!" : "Payment Status"}
              </p>
              <p className="text-xs mt-1 text-zinc-300 font-medium">
                {message.text}
              </p>
            </div>
          </div>
        )}

        {/* Current Plan Card */}
        <div className="p-6 rounded-2xl bg-neutral-900/40 border border-white/[0.06] backdrop-blur-xl mb-10 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                Account Status
              </span>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {isPremiumActive ? (
                  <>
                    Premium Member
                    <Sparkles className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
                  </>
                ) : (
                  "Free Member"
                )}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {isPremiumActive
                  ? `You are currently on the ${subscription?.plan.name}. Thank you for supporting Ted!`
                  : "You are currently using the limited Free tier."}
              </p>
            </div>
            
            <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border uppercase ${
                  isPremiumActive
                    ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                    : "bg-neutral-800 border-zinc-700 text-zinc-400"
                }`}
              >
                {isPremiumActive ? "Premium Active" : "Free Plan"}
              </span>
            </div>
          </div>

          {isPremiumActive && subscription && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    Plan Cost
                  </div>
                  <div className="text-sm font-semibold text-zinc-200 mt-0.5">
                    ₹{subscription.plan.price} /{" "}
                    {subscription.plan.durationDays === 365 ? "year" : "month"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    Renewal Date
                  </div>
                  <div className="text-sm font-semibold text-zinc-200 mt-0.5">
                    {subscription.expiresAt
                      ? new Date(subscription.expiresAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )
                      : "Never"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    Time Remaining
                  </div>
                  <div className="text-sm font-semibold text-zinc-200 mt-0.5">
                    {getDaysRemaining(subscription.expiresAt)} days
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Options Section */}
        <h3 className="text-lg font-bold text-white mb-6">Available Plans</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const isYearly = plan.durationDays === 365;

            return (
              <div
                key={plan.id}
                className={`p-6 rounded-2xl border backdrop-blur-xl transition-all relative flex flex-col justify-between ${
                  isCurrent
                    ? "bg-indigo-500/5 border-indigo-500/40 shadow-lg shadow-indigo-500/5"
                    : "bg-neutral-900/30 border-white/[0.06] hover:border-white/10 hover:bg-neutral-900/40"
                }`}
              >
                {isYearly && (
                  <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[9px] font-bold bg-indigo-600 text-white uppercase tracking-wider shadow-md">
                    Best Value (Save ~65%)
                  </span>
                )}

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-zinc-100">
                        {plan.name}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Full access for {plan.durationDays} days
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
                        <Award className="w-3.5 h-3.5" />
                        Current Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1.5 mb-6">
                    <span className="text-3xl font-extrabold text-white">
                      ₹{plan.price}
                    </span>
                    <span className="text-xs text-zinc-400 font-semibold">
                      / {isYearly ? "year" : "month"}
                    </span>
                  </div>

                  {/* Plan Features */}
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2.5 text-xs text-zinc-300">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>Unlimited real-time audio transcripts</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-zinc-300">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>Advanced Gemini and Deepgram LLM pipeline</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-zinc-300">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>Detailed session analytics & feedback scorecard</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-zinc-300">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>Custom meeting mode & note capturing</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-zinc-300">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>Real-time overlay and screen analysis</span>
                    </li>
                  </ul>
                </div>

                <button
                  disabled={isCurrent || paymentLoading !== null}
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all relative overflow-hidden flex items-center justify-center gap-2 cursor-pointer ${
                    isCurrent
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-default"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/10 active:scale-[0.99]"
                  }`}
                >
                  {paymentLoading === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Processing Checkout...
                    </>
                  ) : isCurrent ? (
                    <>
                      <Check className="w-4 h-4" />
                      Plan Active
                    </>
                  ) : isPremiumActive ? (
                    "Switch to Plan"
                  ) : (
                    "Subscribe Plan"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
