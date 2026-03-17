import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { razorpay } from "@/lib/razorpay";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { tier } = body as { tier: string };

        let amount = 0;
        if (tier === "intermediate") {
            amount = 49900; // Rs 499.00
        } else if (tier === "premium") {
            amount = 99900; // Rs 999.00
        } else {
            return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
        }

        const options = {
            amount,
            currency: "INR",
            receipt: `rcpt_${userId.slice(-8)}_${Date.now().toString(36)}`,
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({ order });
    } catch (error) {
        console.error("Razorpay Create Order Error:", error);
        return NextResponse.json(
            { error: "Failed to create Razorpay order" },
            { status: 500 }
        );
    }
}
