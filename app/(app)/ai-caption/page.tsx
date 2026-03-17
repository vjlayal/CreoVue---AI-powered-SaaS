"use client";

import React, { useState } from "react";
import FeatureGate from "@/components/FeatureGate";
import { SparklesIcon, ImageIcon, CopyIcon, Loader2Icon, CheckCircleIcon, XIcon } from "lucide-react";

export default function AICaptionPage() {
    const [keywords, setKeywords] = useState("");
    const [platform, setPlatform] = useState("Instagram");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [captions, setCaptions] = useState<string[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const [quotaLimit, setQuotaLimit] = useState<number | null>(null);
    const [quotaUsed, setQuotaUsed] = useState<number>(0);
    const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);

    React.useEffect(() => {
        const fetchQuota = async () => {
            try {
                const res = await fetch("/api/ai-caption");
                if (res.ok) {
                    const data = await res.json();
                    setQuotaLimit(data.limit);
                    setQuotaUsed(data.used);
                    setQuotaRemaining(data.remaining);
                }
            } catch (e) {
                console.error("Failed to fetch quota", e);
            }
        };
        fetchQuota();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be less than 5MB");
            return;
        }

        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!keywords.trim()) {
            setError("Please enter some keywords or context.");
            return;
        }

        setError(null);
        setLoading(true);
        setCaptions([]);

        try {
            let imageBase64 = null;
            let imageMimeType = null;

            if (imageFile && imagePreview) {
                // imagePreview is a data URL: "data:image/png;base64,iVBORw0KGgo..."
                const matches = imagePreview.match(/^data:(.+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    imageMimeType = matches[1];
                    imageBase64 = matches[2];
                }
            }

            const response = await fetch("/api/ai-caption", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    keywords,
                    platform,
                    imageBase64,
                    imageMimeType
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate captions");
            }

            if (data.captions && data.captions.length > 0) {
                setCaptions(data.captions);
                
                // Refresh quota
                if (quotaRemaining !== null) {
                    setQuotaUsed(prev => prev + 1);
                    setQuotaRemaining(prev => Math.max(0, (prev || 1) - 1));
                }
            } else {
                throw new Error("No captions returned from AI");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <FeatureGate>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <SparklesIcon className="w-8 h-8 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            AI Captions
                        </h1>
                        <p className="text-gray-400 mt-1">Generate engaging social media descriptions with Gemini 1.5</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Input */}
                    <div className="lg:col-span-5 space-y-6">
                        {quotaRemaining !== null && (
                            <div className={`p-4 rounded-xl border flex items-center justify-between text-sm shadow-sm ${quotaRemaining === 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-purple-500/10 border-purple-500/20 text-purple-200'}`}>
                                <div className="flex items-center gap-2">
                                    <SparklesIcon className="w-4 h-4" />
                                    <span className="font-medium">Daily AI Quota</span>
                                </div>
                                <div className="font-bold">
                                    {quotaRemaining} / {quotaLimit} remaining
                                </div>
                            </div>
                        )}

                        <div className="bg-base-200/50 rounded-2xl p-6 border border-base-content/10 relative overflow-hidden">
                            {quotaRemaining === 0 && (
                                <div className="absolute inset-0 z-10 bg-base-300/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                        <XIcon className="w-8 h-8 text-red-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Daily Quota Reached</h3>
                                    <p className="text-gray-400 text-sm">You have used all {quotaLimit} of your free AI caption generations for today to prevent unintended API charges. Please check back tomorrow!</p>
                                </div>
                            )}
                            
                            {/* Platform Select */}
                            <div className="mb-5">
                                <label className="label">
                                    <span className="label-text font-medium text-gray-300">Target Platform</span>
                                </label>
                                <select 
                                    className="select select-bordered w-full bg-base-300 focus:border-purple-500/50"
                                    value={platform}
                                    onChange={(e) => setPlatform(e.target.value)}
                                >
                                    <option className="bg-gray-900 text-gray-100">Instagram</option>
                                    <option className="bg-gray-900 text-gray-100">Facebook</option>
                                    <option className="bg-gray-900 text-gray-100">Twitter / X</option>
                                    <option className="bg-gray-900 text-gray-100">LinkedIn</option>
                                    <option className="bg-gray-900 text-gray-100">YouTube</option>
                                    <option className="bg-gray-900 text-gray-100">TikTok</option>
                                </select>
                            </div>

                            {/* Keywords Input */}
                            <div className="mb-5">
                                <label className="label">
                                    <span className="label-text font-medium text-gray-300">Context / Keywords</span>
                                </label>
                                <textarea 
                                    className="textarea textarea-bordered w-full h-32 bg-base-300/50 focus:border-purple-500/50 text-base"
                                    placeholder="e.g., A sunny day at the beach with friends, chilling, enjoying the waves"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                ></textarea>
                            </div>

                            {/* Image Upload */}
                            <div className="mb-6">
                                <label className="label">
                                    <span className="label-text font-medium text-gray-300">Optional Image Context</span>
                                </label>
                                
                                {!imagePreview ? (
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-base-content/20 rounded-xl cursor-pointer hover:bg-base-300/50 hover:border-purple-500/40 transition-all">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500">Click to upload an image</p>
                                        </div>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                    </label>
                                ) : (
                                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-base-content/20 group">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button 
                                                className="btn btn-circle btn-sm btn-error"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview(null);
                                                }}
                                            >
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-2">Uploading an image helps the AI see exactly what you're posting about.</p>
                            </div>

                            {error && (
                                <div className="alert alert-error text-sm py-2 mb-4 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                                    {error}
                                </div>
                            )}

                            <button
                                className="w-full py-3.5 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(167,139,250,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center gap-2"
                                style={{ background: "linear-gradient(135deg, #a78bfa, #818cf8, #6366f1)" }}
                                onClick={handleGenerate}
                                disabled={loading || !keywords.trim() || quotaRemaining === 0}
                            >
                                {loading ? (
                                    <Loader2Icon className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <SparklesIcon className="w-5 h-5" />
                                        Generate Magic
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right Column - Results */}
                    <div className="lg:col-span-7">
                        <div className="bg-base-200/30 rounded-2xl p-6 border border-base-content/5 min-h-full">
                            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <span className="w-2 h-6 rounded-full bg-purple-500/50"></span>
                                Generated Results
                            </h2>

                            {captions.length === 0 && !loading && (
                                <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-3">
                                    <SparklesIcon className="w-10 h-10 opacity-20" />
                                    <p>Your AI-generated captions will appear here.</p>
                                </div>
                            )}

                            {loading && (
                                <div className="h-64 flex flex-col items-center justify-center text-purple-400 gap-3">
                                    <Loader2Icon className="w-10 h-10 animate-spin opacity-50" />
                                    <p className="animate-pulse">Consulting the AI minds...</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {captions.map((caption, index) => (
                                    <div 
                                        key={index} 
                                        className="bg-base-300/40 border border-base-content/10 p-5 rounded-xl hover:border-purple-500/30 transition-colors group relative"
                                    >
                                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-300 pr-10">
                                            {caption}
                                        </p>
                                        
                                        <button 
                                            onClick={() => handleCopy(caption, index)}
                                            className="absolute top-4 right-4 p-2 rounded-lg bg-base-100/50 hover:bg-purple-500/20 hover:text-purple-400 text-gray-400 transition-colors border border-base-content/10 shadow-sm"
                                            title="Copy to clipboard"
                                        >
                                            {copiedIndex === index ? (
                                                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                                            ) : (
                                                <CopyIcon className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FeatureGate>
    );
}
