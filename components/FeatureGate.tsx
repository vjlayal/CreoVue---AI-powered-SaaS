"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LockIcon, CrownIcon } from "lucide-react";
import { useTier } from "@/components/TierProvider";
import { TIER_FEATURES, TIER_LABELS, Tier } from "@/lib/subscription";

function getRequiredTier(pathname: string): Tier | null {
    const tiers: Tier[] = ["intermediate", "premium"];
    for (const tier of tiers) {
        if (TIER_FEATURES[tier].includes(pathname)) return tier;
    }
    return null;
}

export default function FeatureGate({ children }: { children: React.ReactNode }) {
    const tier = useTier();
    const pathname = usePathname();
    const allowed = TIER_FEATURES[tier]?.includes(pathname) ?? false;

    if (allowed) return <>{children}</>;

    const requiredTier = getRequiredTier(pathname);
    const requiredLabel = requiredTier ? TIER_LABELS[requiredTier] : "a higher";

    return (
        <div className="relative min-h-[60vh] flex items-center justify-center">
            {/* Blurred ghost of children behind */}
            <div
                className="absolute inset-0 pointer-events-none select-none"
                style={{
                    filter: "blur(8px) brightness(0.3)",
                    opacity: 0.4,
                    overflow: "hidden",
                }}
            >
                {children}
            </div>

            {/* Lock overlay card */}
            <div
                className="relative z-10 flex flex-col items-center text-center px-8 py-10 rounded-2xl max-w-md mx-auto"
                style={{
                    background: "rgba(15, 15, 30, 0.85)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 8px 40px rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(16px)",
                }}
            >
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                    style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                >
                    <LockIcon className="w-7 h-7 text-gray-400" />
                </div>

                <h2 className="text-xl font-bold text-white mb-2">
                    Feature Locked
                </h2>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                    This feature requires the <span className="font-semibold text-white">{requiredLabel}</span> plan or higher.
                    Upgrade your subscription to unlock it.
                </p>

                <Link
                    href="/subscription"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
                    style={{
                        background: "linear-gradient(135deg, rgba(250, 204, 21, 0.85), rgba(245, 158, 11, 0.85))",
                        color: "#1a1a2e",
                        border: "1px solid rgba(250, 204, 21, 0.3)",
                        boxShadow: "0 0 20px rgba(250, 204, 21, 0.15)",
                    }}
                >
                    <CrownIcon className="w-4 h-4" />
                    View Plans & Upgrade
                </Link>
            </div>
        </div>
    );
}
