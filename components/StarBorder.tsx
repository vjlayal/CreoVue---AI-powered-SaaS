"use client";

import React, { useRef, useEffect } from "react";

interface StarBorderProps {
    children: React.ReactNode;
    className?: string;
    color?: string;
    speed?: number; // seconds per rotation
    style?: React.CSSProperties;
}

const StarBorder: React.FC<StarBorderProps> = ({
    children,
    className = "",
    color = "#a78bfa",
    speed = 4,
    style,
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
                    background: `conic-gradient(from 0deg, transparent 0%, ${color} 1%, transparent 2%, transparent 50%, ${color} 51%, transparent 52%)`,
                    zIndex: 0,
                    opacity: 0.4,
                }}
            />
            {/* Content sits on top */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    borderRadius: "0.75rem",
                    background: "rgba(8, 8, 18, 0.95)",
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default StarBorder;
