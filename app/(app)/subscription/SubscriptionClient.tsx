"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
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
            className={`card border ${currentTier === plan.id ? "border-primary bg-gray-950" : "border-stone-600"} shadow-lg hover:border-white rounded-xl transition p-4`}
          >
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
                  className={`btn btn-primary border-2 rounded-xl bg-gray-950 btn-sm`}
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
    </div>
  );
}
