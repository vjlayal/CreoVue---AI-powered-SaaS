"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % 3);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const particles = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 30 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      width: `${2 + Math.random() * 3}px`,
      height: `${2 + Math.random() * 3}px`,
      animationDelay: `${Math.random() * 8}s`,
      animationDuration: `${6 + Math.random() * 8}s`,
      opacity: 0.15 + Math.random() * 0.35,
    }));
  }, [mounted]);

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
          particles.map((style, i) => (
            <div
              key={i}
              className="landing-particle"
              style={style}
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
      <div className="landing-content w-full">
        <div className="min-h-svh flex flex-col items-center justify-center w-full pt-16">
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
        </div>

        {/* Dashboard Preview mock */}
        <div className="landing-dashboard-preview mt-12 mb-16 max-w-5xl mx-auto w-full px-4 relative group perspective-[2000px]">
          <div className="absolute inset-0 bg-linear-to-t from-primary/20 to-transparent blur-3xl -z-10 rounded-[3rem]" />
          <div className="relative rounded-4xl border border-stone-700/50 bg-stone-900/80 backdrop-blur-sm overflow-hidden shadow-2xl transition-transform duration-700 hover:rotate-x-2">
            <div className="flex items-center gap-2 p-4 border-b border-stone-800 bg-stone-950/50">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="relative w-full aspect-4/3 sm:aspect-16/10 md:aspect-video bg-stone-900 overflow-hidden border-t border-stone-800">
              {[0, 1, 2].map((index) => (
                <img
                  key={index}
                  src={`/dashboard-preview-${index + 1}.png`}
                  alt={`CreoVue Dashboard Preview Tier ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover md:object-contain bg-stone-900 transition-opacity duration-1000 ease-in-out ${
                    previewIndex === index ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* AI Captions Feature Showcase */}
        <div className="landing-captions-showcase mt-16 mb-16 text-center max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold mb-6">
            <span className="animate-pulse">✨</span> Next-Gen AI Captons
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-indigo-400">
            Let AI tell your story.
          </h2>
          <p className="text-lg text-stone-400 mb-10 max-w-2xl mx-auto">
            Our multimodal AI analyzes your video and image context to generate compelling, context-aware captions in seconds.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="bg-stone-900/60 p-6 rounded-2xl border border-stone-700/50 shadow-lg">
              <div className="text-stone-500 font-medium mb-3 text-sm">Image Uploaded</div>
              <div className="relative rounded-lg overflow-hidden mb-4 border border-stone-800">
                <img 
                  src="/AI-caption-uploaded.jpg" 
                  alt="Uploaded Image" 
                  className="w-full aspect-video object-cover" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML += '<div class="w-full aspect-video flex items-center justify-center text-stone-500 font-bold bg-stone-800">[Image not found]</div>'; }} 
                />
              </div>
            </div>
            <div className="bg-stone-900/60 p-6 rounded-2xl border border-stone-700/50 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 to-blue-500/5" />
              <div className="text-purple-400 font-medium mb-3 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" /> AI Output
              </div>
              <p className="text-stone-300 italic">"Chasing the final rays of sun at golden hour. Nothing beats the serenity of this view! 🌅✨ #SunsetLovers #GoldenHour #NatureVibes"</p>
            </div>
          </div>
        </div>

        {/* Smart Crop Before/After */}
        <div className="landing-smart-crop mt-16 mb-24 max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Smart Crop for Every Platform</h2>
          <p className="text-lg text-stone-400 mb-10 max-w-2xl mx-auto">Upload once. Automatically refocus and crop for Instagram, Twitter, Facebook, and more with AI face and object detection.</p>
          <div className="grid md:grid-cols-2 gap-8 items-center">
             <div className="relative rounded-2xl border border-stone-700/50 bg-stone-900/50 overflow-hidden group">
               <div className="absolute top-4 left-4 bg-stone-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-stone-300 border border-stone-700">Original (Landscape)</div>
               <img src="/smart-crop-before.jpg" alt="Before Smart Crop" className="w-full aspect-video object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML += '<div class="w-full aspect-video flex items-center justify-center text-stone-500 border border-stone-800">[Replace with /smart-crop-before.jpg]</div>'; }} />
             </div>
             <div className="relative rounded-2xl border border-indigo-500/30 bg-indigo-950/20 overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.15)] group">
               <div className="absolute top-4 left-4 bg-indigo-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-indigo-300 border border-indigo-500/50">Smart Cropped (Vertical)</div>
               <img src="/smart-crop-after.jpg" alt="After Smart Crop" className="w-full aspect-4/5 object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML += '<div class="w-full aspect-4/5 flex items-center justify-center text-indigo-400 border border-indigo-900/50">[Replace with /smart-crop-after.jpg]</div>'; }} />
             </div>
          </div>
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
        <div className="landing-social-proof mt-24">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex -space-x-3 mb-2">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-stone-950 bg-stone-800 flex items-center justify-center overflow-hidden">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}&backgroundColor=transparent`} alt="avatar" />
                </div>
              ))}
            </div>
            <span className="landing-social-text text-stone-300 text-lg">
              Loved by <strong>10,000+ creators</strong> globally
            </span>
            <div className="text-sm text-stone-500 font-medium tracking-widest uppercase mt-2">
              Built by a creator, for creators
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="landing-bottom-accent" />
    </div>
  );
}
