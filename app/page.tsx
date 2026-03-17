"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import StarBorder from "@/components/StarBorder";
import { useTier } from "@/components/TierProvider";

const Prism = dynamic(() => import("@/components/Prism"), { ssr: false });

const features = [
  { icon: "🎬", label: "Video Processing" },
  { icon: "🤖", label: "AI-Powered" },
  { icon: "🔄", label: "Media Conversion" },
  { icon: "📱", label: "Social Sharing" },
  { icon: "📊", label: "QR Toolkit" },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const tier = useTier();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Map tiers to Prism config
  const prismConfig = {
    basic: { hueShift: 0, colorFrequency: 0.5, glow: 0.1 },
    intermediate: { hueShift: 300, colorFrequency: 1.2, glow: 0.3 },
    premium: { hueShift: 220, colorFrequency: 1.7, glow: 0.5 },
  }[tier] || { hueShift: 220, colorFrequency: 1.7, glow: 0.5 };

  return (
    <div className="landing-page">
      {/* Prism Background — fully visible, vivid */}
      <div className="landing-prism-bg">
        <Prism
          animationType="hover"
          hueShift={prismConfig.hueShift}
          glow={prismConfig.glow}
          bloom={1.4}
          noise={0}
          scale={3.5}
          colorFrequency={prismConfig.colorFrequency}
          timeScale={0.4}
          transparent={false}
          hoverStrength={3}
        />
      </div>

      {/* Floating particles */}
      <div className="landing-particles" aria-hidden="true">
        {mounted &&
          Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="landing-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${2 + Math.random() * 3}px`,
                height: `${2 + Math.random() * 3}px`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${6 + Math.random() * 8}s`,
                opacity: 0.15 + Math.random() * 0.35,
              }}
            />
          ))}
      </div>

      {/* Decorative gradient orbs */}
      <div className="landing-orb landing-orb-1" />
      <div className="landing-orb landing-orb-2" />
      <div className="landing-orb landing-orb-3" />

      {/* Top Navbar */}
      <nav className="landing-navbar">
        <div className="landing-navbar-brand">CreoVue</div>
        <div className="landing-navbar-links">
          <Link href="/sign-in" className="landing-nav-link">
            Sign In
          </Link>
          <Link href="/sign-up" className="landing-nav-btn">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="landing-content">
        {/* Badge */}
        <div className="landing-badge">
          <span className="landing-badge-dot" />
          AI-Powered Creative Suite
        </div>

        {/* Brand Name */}
        <div className="landing-brand-wrapper">
          <h1 className="landing-brand">CreoVue</h1>
          <div className="landing-brand-glow" />
        </div>

        {/* Motto */}
        <p className="landing-motto">
          Transform your creative vision into reality — powered by AI.
        </p>
        <p className="landing-sub-motto">
          Video processing, media conversion, social sharing & more — all in one
          stunning dashboard.
        </p>

        {/* CTA Buttons */}
        <div className="landing-cta-group">
          <Link href="/home" className="landing-btn landing-btn-primary">
            <span className="landing-btn-shine" />
            Get Started Free
            <svg
              className="landing-btn-arrow"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
          <Link href="/sign-in" className="landing-btn landing-btn-secondary">
            Sign In
          </Link>
        </div>

        {/* Feature Pills */}
        <div className="landing-features">
          {features.map((f, i) => (
            <div
              key={f.label}
              className="landing-feature-pill"
              style={{ animationDelay: `${0.8 + i * 0.1}s` }}
            >
              <span className="landing-feature-icon">{f.icon}</span>
              <span className="landing-feature-label">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="landing-social-proof">
          <span className="landing-social-text">
            Trusted by <strong>creators</strong> worldwide
          </span>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="landing-bottom-accent" />
    </div>
  );
}
