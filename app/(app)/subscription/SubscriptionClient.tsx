"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { Check, Minus } from "lucide-react";
import { useTier } from "@/components/TierProvider";

type Plan = {
  id: "basic" | "intermediate" | "premium";
  title: string;
  price: string;
  period?: string;
  features: string[];
};

const plans: Plan[] = [
  {
    id: "basic",
    title: "Basic (Free)",
    price: "₹0",
    period: "3 months",
    features: [
      "Image & Video Uploads",
      "Personal Dashboard",
      "Standard Usage Limits"
    ],
  },
  {
    id: "intermediate",
    title: "Pro (Intermediate)",
    price: "₹499",
    period: "6 months",
    features: [
      "Image & Video Uploads",
      "Social Media Quick-Share",
      "Custom QR Code Toolkit",
      "Increased Usage Limits"
    ],
  },
  {
    id: "premium",
    title: "Premium",
    price: "₹999",
    period: "12 months",
    features: [
      "Custom QR Code Toolkit",
      "Social Media Quick-Share",
      "Smart Media Converter",
      "AI Caption Generator (Multimodal)",
      "Maximum Usage Limits"
    ],
  },
];

export default function SubscriptionClient() {
  const currentTier = useTier();
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePayment = async (planId: string) => {
    if (planId === "basic") {
      setMessage("You are already on the basic tier, or your premium plans have expired. Basic is free!");
      return;
    }

    setLoading(true);
    setSelected(planId);
    setMessage(null);

    try {
      // 1. Create order on server
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: planId }),
      });
      const orderData = await orderRes.json();

      if (!orderData.order) throw new Error(orderData.error || "Failed order");

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_YOUR_KEY_HERE",
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "CreoVue SaaS",
        description: `Upgrading to ${planId} tier`,
        order_id: orderData.order.id,
        handler: async function (response: any) {
          // 3. Verify Payment Signature
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              tier: planId,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setMessage(`Payment successful! You are now subscribed to ${planId}.`);
            setTimeout(() => window.location.reload(), 2000);
          } else {
            setMessage("Payment verification failed.");
          }
        },
        theme: {
          color: "#8b5cf6",
        },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
    } catch (err: any) {
      setMessage(err.message || "An error occurred during checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <p className="text-sm text-gray-300">Choose a plan that fits your needs.</p>
        </div>
        <div>
          <Link href="/home" className="btn btn-ghost btn-sm">
            Back to Home
          </Link>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-md bg-gray-950 text-white border border-gray-600">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`card border relative ${currentTier === plan.id ? "border-primary bg-gray-950" : "border-stone-600"} shadow-lg hover:border-white rounded-xl transition p-4`}
          >
            {plan.id === "intermediate" && (
              <div className="absolute top-0 right-0 -mt-3 -mr-3 bg-linear-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-orange-300 z-10">
                Most Popular
              </div>
            )}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{plan.title}</h3>
              <div className="text-right">
                <div className="text-2xl font-bold">{plan.price}</div>
                <div className="text-sm text-gray-400">{plan.period}</div>
              </div>
            </div>
            <ul className="mt-4 mb-4 list-disc list-inside text-sm text-gray-300 min-h-[80px]">
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>

            <div className="flex items-center justify-between mt-auto">
              {currentTier === plan.id ? (
                <div className="text-sm text-green-500 font-semibold p-2">Current Plan</div>
              ) : (
                <button
                  className={`btn ${plan.id === "intermediate" ? 'bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white border-none shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'btn-primary border-2 bg-gray-950'} rounded-xl btn-sm`}
                  onClick={() => handlePayment(plan.id)}
                  disabled={loading && selected === plan.id}
                >
                  {loading && selected === plan.id ? "Processing..." : "Upgrade"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-20 w-full">
        <h2 className="text-2xl font-bold mb-8 text-center bg-clip-text text-transparent bg-linear-to-r from-stone-200 to-stone-400">Feature Comparison</h2>
        <div className="overflow-x-auto rounded-3xl border border-stone-800 bg-stone-900/50 shadow-xl">
          <table className="table w-full text-stone-300">
            <thead>
              <tr className="border-b border-stone-700 bg-stone-950">
                <th className="text-left py-6 px-6 font-semibold text-stone-200">Features</th>
                <th className="text-center py-6 px-6 font-semibold text-stone-200">Basic</th>
                <th className="text-center py-6 px-6 font-semibold text-amber-500">Pro</th>
                <th className="text-center py-6 px-6 font-semibold text-purple-400">Premium</th>
              </tr>
            </thead>
            <tbody>
              {/* Feature Rows */}
              <tr className="border-b border-stone-800/50 hover:bg-stone-800/30 transition-colors">
                <td className="py-6 px-6">Image & Video Uploads</td>
                <td className="text-center"><Check className="w-5 h-5 mx-auto text-stone-300" /></td>
                <td className="text-center"><Check className="w-5 h-5 mx-auto text-stone-300" /></td>
                <td className="text-center"><Check className="w-5 h-5 mx-auto text-stone-300" /></td>
              </tr>
              <tr className="border-b border-stone-800/50 hover:bg-stone-800/30 transition-colors">
                <td className="py-6 px-6">Personal Dashboard</td>
                <td className="text-center"><Check className="w-5 h-5 mx-auto text-stone-300" /></td>
                <td className="text-center"><Check className="w-5 h-5 mx-auto text-stone-300" /></td>
                <td className="text-center"><Check className="w-5 h-5 mx-auto text-stone-300" /></td>
              </tr>
              <tr className="border-b border-stone-800/50 hover:bg-stone-800/30 transition-colors">
                <td className="py-6 px-6">Smart Crop (Social Frame)</td>
                <td className="text-center"><Minus className="w-5 h-5 mx-auto text-stone-600" /></td>
                <td className="text-center"><Check className="w-5 h-5 mx-auto text-stone-300" /></td>
                <td className="text-center"><Check className="w-5 h-5 mx-auto text-stone-300" /></td>
              </tr>
              <tr className="border-b border-stone-800/50 hover:bg-stone-800/30 transition-colors">
                <td className="py-6 px-6">Custom QR Code Toolkit</td>
                <td className="text-center"><Minus className="w-5 h-5 mx-auto text-stone-600" /></td>
                <td className="text-center"><Check className="w-5 h-5 mx-auto text-stone-300" /></td>
                <td className="text-center"><Check className="w-5 h-5 mx-auto text-stone-300" /></td>
              </tr>
              <tr className="border-b border-stone-800/50 hover:bg-stone-800/30 transition-colors">
                <td className="py-6 px-6">Smart Media Converter</td>
                <td className="text-center"><Minus className="w-5 h-5 mx-auto text-stone-600" /></td>
                <td className="text-center"><Minus className="w-5 h-5 mx-auto text-stone-600" /></td>
                <td className="text-center"><Check className="w-5 h-5 mx-auto text-stone-300" /></td>
              </tr>
              <tr className="border-b border-stone-800/50 hover:bg-stone-800/30 transition-colors">
                <td className="py-6 px-6">AI Multimodal Captions</td>
                <td className="text-center"><Minus className="w-5 h-5 mx-auto text-stone-600" /></td>
                <td className="text-center"><Minus className="w-5 h-5 mx-auto text-stone-600" /></td>
                <td className="text-center"><Check className="w-5 h-5 mx-auto text-stone-300" /></td>
              </tr>
              <tr className="hover:bg-stone-800/30 transition-colors">
                <td className="py-6 px-6">Usage Limits</td>
                <td className="text-center text-sm text-stone-400">Standard</td>
                <td className="text-center text-sm font-semibold text-amber-500">Increased</td>
                <td className="text-center text-sm font-bold text-purple-400">Maximum</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-20 mb-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center bg-clip-text text-transparent bg-linear-to-r from-white to-stone-400">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="collapse collapse-plus bg-stone-900 border border-stone-800 rounded-xl">
            <input type="radio" name="faq-accordion" defaultChecked /> 
            <div className="collapse-title text-lg font-medium">Can I upgrade or downgrade my plan later?</div>
            <div className="collapse-content text-stone-400">
              <p>Yes, you can upgrade your plan at any time. Changes to your subscription will be pro-rated. Downgrades will take effect at the start of your next billing cycle.</p>
            </div>
          </div>
          <div className="collapse collapse-plus bg-stone-900 border border-stone-800 rounded-xl">
            <input type="radio" name="faq-accordion" /> 
            <div className="collapse-title text-lg font-medium">What happens if I exceed my usage limits?</div>
            <div className="collapse-content text-stone-400">
              <p>If you hit your tier limits, you&apos;ll be prompted to upgrade to the next tier. Don&apos;t worry, your existing media will remain safe and accessible.</p>
            </div>
          </div>
          <div className="collapse collapse-plus bg-stone-900 border border-stone-800 rounded-xl">
            <input type="radio" name="faq-accordion" /> 
            <div className="collapse-title text-lg font-medium">Do you offer refunds?</div>
            <div className="collapse-content text-stone-400">
              <p>We do not offer refunds for partial subscription periods. However, you can cancel your subscription at any time to prevent future charges.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
