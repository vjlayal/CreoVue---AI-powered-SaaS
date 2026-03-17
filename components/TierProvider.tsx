"use client";

import React, { createContext, useContext } from "react";
import { Tier } from "@/lib/subscription";

const TierContext = createContext<Tier>("basic");

export const TierProvider = ({ children, tier }: { children: React.ReactNode; tier: Tier }) => {
    return (
        <TierContext.Provider value={tier}>
            {children}
        </TierContext.Provider>
    );
};

export const useTier = () => useContext(TierContext);
