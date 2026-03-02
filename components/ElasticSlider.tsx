"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

interface ElasticSliderProps {
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
    onChange?: (value: number) => void;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    className?: string;
}

const ElasticSlider: React.FC<ElasticSliderProps> = ({
    defaultValue = 50,
    min = 0,
    max = 100,
    step = 1,
    onChange,
    leftIcon,
    rightIcon,
    className = "",
}) => {
    const [value, setValue] = useState(defaultValue);
    const [isDragging, setIsDragging] = useState(false);
    const [elasticOffset, setElasticOffset] = useState(0);
    const trackRef = useRef<HTMLDivElement>(null);
    const animRef = useRef<number>(0);

    const percentage = ((value - min) / (max - min)) * 100;

    const updateValue = useCallback(
        (clientX: number) => {
            const track = trackRef.current;
            if (!track) return;
            const rect = track.getBoundingClientRect();
            const raw = (clientX - rect.left) / rect.width;
            const clamped = Math.max(0, Math.min(1, raw));
            const stepped =
                Math.round((clamped * (max - min)) / step) * step + min;
            const newVal = Math.max(min, Math.min(max, stepped));
            setValue(newVal);
            onChange?.(newVal);
        },
        [min, max, step, onChange]
    );

    const handlePointerDown = useCallback(
        (e: React.PointerEvent) => {
            e.preventDefault();
            setIsDragging(true);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            updateValue(e.clientX);
        },
        [updateValue]
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!isDragging) return;
            updateValue(e.clientX);

            // Calculate elastic offset based on movement speed
            const track = trackRef.current;
            if (!track) return;
            const rect = track.getBoundingClientRect();
            const raw = (e.clientX - rect.left) / rect.width;
            const overshoot = raw < 0 ? raw * 30 : raw > 1 ? (raw - 1) * 30 : 0;
            setElasticOffset(overshoot);
        },
        [isDragging, updateValue]
    );

    const handlePointerUp = useCallback(() => {
        setIsDragging(false);
        // Spring back animation
        const springBack = () => {
            setElasticOffset((prev) => {
                const next = prev * 0.7;
                if (Math.abs(next) < 0.1) return 0;
                animRef.current = requestAnimationFrame(springBack);
                return next;
            });
        };
        animRef.current = requestAnimationFrame(springBack);
    }, []);

    useEffect(() => {
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, []);

    return (
        <div className={`elastic-slider-container ${className}`}>
            <div className="elastic-slider-wrapper">
                {leftIcon && (
                    <div
                        className="elastic-slider-icon"
                        style={{
                            opacity: 0.4 + (1 - percentage / 100) * 0.6,
                            transform: `scale(${0.85 + (1 - percentage / 100) * 0.15})`,
                        }}
                    >
                        {leftIcon}
                    </div>
                )}
                <div
                    ref={trackRef}
                    className="elastic-slider-root"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    style={{ cursor: isDragging ? "grabbing" : "grab" }}
                >
                    {/* Value indicator */}
                    <div
                        className="elastic-slider-value"
                        style={{
                            left: `${percentage}%`,
                            transform: `translateX(-50%) translateY(-1.2rem) ${isDragging ? "scale(1.2)" : "scale(1)"
                                }`,
                            opacity: isDragging ? 1 : 0.7,
                        }}
                    >
                        {Math.round(value)}
                    </div>

                    {/* Track */}
                    <div className="elastic-slider-track-wrapper">
                        <div className="elastic-slider-track">
                            <div
                                className="elastic-slider-range"
                                style={{
                                    width: `${percentage}%`,
                                    transform: `translateX(${elasticOffset}px)`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Thumb */}
                    <div
                        className="elastic-slider-thumb"
                        style={{
                            left: `${percentage}%`,
                            transform: `translateX(-50%) translateX(${elasticOffset}px) ${isDragging ? "scale(1.3)" : "scale(1)"
                                }`,
                        }}
                    />
                </div>
                {rightIcon && (
                    <div
                        className="elastic-slider-icon"
                        style={{
                            opacity: 0.4 + (percentage / 100) * 0.6,
                            transform: `scale(${0.85 + (percentage / 100) * 0.15})`,
                        }}
                    >
                        {rightIcon}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ElasticSlider;
