"use client";

import React, { useRef, useEffect } from "react";

interface StarBorderProps {
    children: React.ReactNode;
    className?: string;
    color?: string;
    speed?: number; // seconds per rotation
    style?: React.CSSProperties;
    background?: string;
}

const StarBorder: React.FC<StarBorderProps> = ({
    children,
    className = "",
    color = "#a78bfa",
    speed = 4,
    style,
    background = "rgba(8, 8, 18, 0.95)",
}) => {
    const gradientRef = useRef<HTMLDivElement>(null);
    const animFrameRef = useRef<number>(0);

    useEffect(() => {
        const el = gradientRef.current;
        if (!el) return;

        let rotation = 0;
        let lastTime = performance.now();

        const animate = (now: number) => {
            const dt = (now - lastTime) / 1000;
            lastTime = now;
            rotation = (rotation + (360 / speed) * dt) % 360;
            el.style.transform = `rotate(${rotation}deg)`;
            animFrameRef.current = requestAnimationFrame(animate);
        };

        animFrameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [speed]);

    return (
        <div
            className={className}
            style={{
                ...style,
                position: "relative",
                padding: "2px",
                borderRadius: "0.85rem",
                overflow: "hidden",
            }}
        >
            {/* Rotating conic-gradient border — real DOM element, not pseudo */}
            <div
                ref={gradientRef}
                style={{
                    position: "absolute",
                    inset: "-50%",
                    background: `conic-gradient(from 0deg, transparent 0%, ${color} 10%, transparent 20%, transparent 50%, ${color} 60%, transparent 70%)`,
                    zIndex: 0,
                }}
            />
            {/* Content sits on top */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    borderRadius: "0.75rem",
                    background,
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default StarBorder;
