"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
    UploadIcon,
    Trash2Icon,
    CheckCircleIcon,
    AlertCircleIcon,
    Loader2Icon,
    ImageIcon,
    ShieldIcon,
} from "lucide-react";

export default function SettingsPage() {
    const [watermarkUrl, setWatermarkUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const fetchWatermark = useCallback(async () => {
        try {
            const res = await axios.get("/api/watermark");
            setWatermarkUrl(res.data.watermarkUrl);
        } catch {
            // No watermark set yet — that's fine
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWatermark();
    }, [fetchWatermark]);

    const handleUpload = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            showMessage("error", "Please upload an image file (PNG recommended for transparency).");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            showMessage("error", "Watermark image must be under 2MB.");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await axios.post("/api/watermark", formData);
            setWatermarkUrl(res.data.watermarkUrl);
            showMessage("success", "Watermark logo uploaded! It will be applied to future video uploads.");
        } catch (err: any) {
            showMessage("error", err?.response?.data?.error || "Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await axios.delete("/api/watermark");
            setWatermarkUrl(null);
            showMessage("success", "Watermark removed. Future videos will not be watermarked.");
        } catch {
            showMessage("error", "Failed to remove watermark.");
        } finally {
            setDeleting(false);
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleUpload(file);
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-primary/10 rounded-xl">
                    <ShieldIcon className="w-7 h-7 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Settings</h1>
                    <p className="text-sm text-gray-400">
                        Manage your account preferences
                    </p>
                </div>
            </div>

            {/* Message Toast */}
            {message && (
                <div
                    className={`mb-6 flex items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all ${message.type === "success"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                >
                    {message.type === "success" ? (
                        <CheckCircleIcon className="w-5 h-5 shrink-0" />
                    ) : (
                        <AlertCircleIcon className="w-5 h-5 shrink-0" />
                    )}
                    {message.text}
                </div>
            )}

            {/* Watermark Card */}
            <div className="card bg-gray-800/60 border border-gray-700/50 shadow-xl rounded-2xl overflow-hidden">
                <div className="card-body p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-1">
                        <ImageIcon className="w-5 h-5 text-primary" />
                        <h2 className="card-title text-lg">Automatic Watermarking</h2>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">
                        Upload your logo once. Every video you upload will be automatically
                        branded with it in the bottom-right corner.
                    </p>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2Icon className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : watermarkUrl ? (
                        /* Current watermark preview */
                        <div className="space-y-4">
                            <div className="bg-gray-900/60 border border-gray-700/40 rounded-xl p-6 flex flex-col items-center gap-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                    Current Watermark
                                </p>
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-700/30 border border-gray-600/30 flex items-center justify-center">
                                        <img
                                            src={watermarkUrl}
                                            alt="Your watermark"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                    <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                                        <CheckCircleIcon className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                <p className="text-xs text-green-400">
                                    Active — applied to all new videos
                                </p>
                            </div>

                            <div className="flex gap-3">
                                {/* Replace */}
                                <label className="btn btn-outline btn-sm rounded-xl flex-1 cursor-pointer border-gray-600 hover:bg-gray-700">
                                    <UploadIcon className="w-4 h-4 mr-2" />
                                    Replace Logo
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={onFileChange}
                                        disabled={uploading}
                                    />
                                </label>
                                {/* Remove */}
                                <button
                                    className="btn btn-outline btn-error btn-sm rounded-xl flex-1"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Trash2Icon className="w-4 h-4 mr-2" />
                                    )}
                                    Remove
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Upload zone */
                        <label
                            className={`cursor-pointer block`}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOver(true);
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={onDrop}
                        >
                            <div
                                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 transition-all ${dragOver
                                        ? "border-primary bg-primary/5"
                                        : "border-gray-600 hover:border-gray-400"
                                    }`}
                            >
                                {uploading ? (
                                    <Loader2Icon className="w-10 h-10 animate-spin text-primary" />
                                ) : (
                                    <UploadIcon className="w-10 h-10 text-gray-500" />
                                )}
                                <div className="text-center">
                                    <p className="font-medium text-gray-300">
                                        {uploading
                                            ? "Uploading..."
                                            : "Drop your logo here or click to browse"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        PNG recommended for transparency · Max 2MB
                                    </p>
                                </div>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={onFileChange}
                                disabled={uploading}
                            />
                        </label>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <p className="text-xs text-blue-300/70">
                    <strong>How it works:</strong> Your watermark is placed at the
                    bottom-right corner of every video with 60% opacity so your content
                    stays visible. The logo is resized to fit (max 300×300px).
                </p>
            </div>
        </div>
    );
}
