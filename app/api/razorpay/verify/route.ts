import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { TIER_DURATIONS_MONTHS } from "@/lib/subscription";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tier } = body;

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) throw new Error("Missing razorpay secret");

        // Verify signature
        const hmac = crypto.createHmac("sha256", secret);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generatedSignature = hmac.digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
        }

        // Success! Update Subscription DB
        const durationMonths = TIER_DURATIONS_MONTHS[tier as keyof typeof TIER_DURATIONS_MONTHS] || 0;

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);

        const subscription = await prisma.subscription.upsert({
            where: { userId },
            update: {
                tier,
                startDate,
                endDate,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
            },
            create: {
                userId,
                tier,
                startDate,
                endDate,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
            },
        });

        return NextResponse.json({ success: true, subscription });
    } catch (error) {
        console.error("Razorpay Verify Error:", error);
        return NextResponse.json(
            { error: "Failed to verify Razorpay payment" },
            { status: 500 }
        );
    }
}
