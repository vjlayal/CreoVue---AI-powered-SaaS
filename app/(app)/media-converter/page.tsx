"use client";

import React, { useState } from "react";
import FeatureGate from "@/components/FeatureGate";
import { SparklesIcon, ImageIcon, VideoIcon } from "lucide-react";
import ImageConverterTab from "./ImageConverterTab";
import VideoConverterTab from "./VideoConverterTab";

export default function MediaConverterPage() {
    const [activeTab, setActiveTab] = useState<"image" | "video">("image");

    return (
        <FeatureGate>
            <div className="max-w-4xl mx-auto pb-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                            <SparklesIcon className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                Batch Media Converter
                            </h1>
                            <p className="text-gray-400 mt-1">
                                Convert images and videos securely in your browser
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-base-300/50 p-1 rounded-xl w-fit mb-8 border border-base-content/10">
                    <button
                        onClick={() => setActiveTab("image")}
                        className={`flex items-center gap-2 px-6 py-2.5 mx-0.5 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === "image"
                                ? "bg-base-100 shadow-sm text-white"
                                : "text-gray-500 hover:text-gray-300 hover:bg-base-200/50"
                        }`}
                    >
                        <ImageIcon className={`w-4 h-4 ${activeTab === "image" ? "text-purple-400" : ""}`} />
                        Image Converter
                    </button>
                    <button
                        onClick={() => setActiveTab("video")}
                        className={`flex items-center gap-2 px-6 py-2.5 mx-0.5 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === "video"
                                ? "bg-base-100 shadow-sm text-white"
                                : "text-gray-500 hover:text-gray-300 hover:bg-base-200/50"
                        }`}
                    >
                        <VideoIcon className={`w-4 h-4 ${activeTab === "video" ? "text-purple-400" : ""}`} />
                        Video Converter
                    </button>
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                    {activeTab === "image" ? <ImageConverterTab /> : <VideoConverterTab />}
                </div>

                {/* Info footer */}
                <div className="mt-8 p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl shadow-inner">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg shrink-0">
                            <SparklesIcon className="w-5 h-5 text-purple-400" />
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed pt-1">
                            <strong className="text-purple-300">100% Client-Side.</strong> All conversions happen locally on your device. Your media files are never uploaded to any server. Completely private and secure. 
                            {activeTab === "video" && " Video conversion utilizes FFmpeg compiled to WebAssembly for native-like performance."}
                        </p>
                    </div>
                </div>
            </div>
        </FeatureGate>
    );
}
