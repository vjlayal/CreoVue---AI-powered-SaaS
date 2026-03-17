import prisma from "@/lib/prisma";

export const MAX_USER_TOTAL_VIDEOS = {
    basic: 10,
    intermediate: 50,
    premium: 200,
};

export const MAX_USER_HOURLY_VIDEOS = {
    basic: 3,
    intermediate: 10,
    premium: 50,
};

export const TIER_DURATIONS_MONTHS = {
    intermediate: 6,
    premium: 12,
};

export type Tier = "basic" | "intermediate" | "premium";

export const TIER_LABELS: Record<Tier, string> = {
    basic: "Free",
    intermediate: "Pro",
    premium: "Premium",
};

export const TIER_FEATURES: Record<Tier, string[]> = {
    basic: ["/home", "/video-upload", "/settings", "/subscription"],
    intermediate: ["/home", "/video-upload", "/social-share", "/qr-toolkit", "/settings", "/subscription"],
    premium: ["/home", "/video-upload", "/social-share", "/qr-toolkit", "/media-converter", "/ai-caption", "/settings", "/subscription"],
};

export async function getUserTier(userId: string): Promise<Tier> {
    if (!userId) return "basic";

    const sub = await prisma.subscription.findUnique({
        where: { userId },
    });

    if (!sub) return "basic";

    const now = new Date();
    if (sub.endDate < now) {
        return "basic";
    }

    return sub.tier as Tier;
}
