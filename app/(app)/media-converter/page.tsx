"use client";

import React, { useState, useCallback, useRef } from "react";
import {
    UploadIcon,
    DownloadIcon,
    Trash2Icon,
    ImageIcon,
    Loader2Icon,
    CheckCircleIcon,
    AlertCircleIcon,
    ArrowRightIcon,
    SparklesIcon,
    XIcon,
    DiamondIcon,
} from "lucide-react";
import ElasticSlider from "@/components/ElasticSlider";

type OutputFormat = "webp" | "png" | "jpeg";

interface ConvertibleImage {
    id: string;
    file: File;
    preview: string;
    name: string;
    originalSize: number;
    status: "pending" | "converting" | "done" | "error";
    convertedBlob?: Blob;
    convertedSize?: number;
    convertedUrl?: string;
    error?: string;
}

const FORMAT_INFO: Record<
    OutputFormat,
    { label: string; ext: string; mime: string; desc: string; color: string }
> = {
    webp: {
        label: "WebP",
        ext: "webp",
        mime: "image/webp",
        desc: "Best for websites — small size, great quality",
        color: "text-green-400",
    },
    png: {
        label: "PNG",
        ext: "png",
        mime: "image/png",
        desc: "Lossless quality — perfect for graphics & logos",
        color: "text-blue-400",
    },
    jpeg: {
        label: "JPG",
        ext: "jpg",
        mime: "image/jpeg",
        desc: "Universal format — ideal for social media",
        color: "text-yellow-400",
    },
};

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

export default function MediaConverterPage() {
    const [images, setImages] = useState<ConvertibleImage[]>([]);
    const [outputFormat, setOutputFormat] = useState<OutputFormat>("webp");
    const [quality, setQuality] = useState(85);
    const [converting, setConverting] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addFiles = useCallback((files: FileList | File[]) => {
        const imageFiles = Array.from(files).filter((f) =>
            f.type.startsWith("image/")
        );
        const newImages: ConvertibleImage[] = imageFiles.map((file) => ({
            id: generateId(),
            file,
            preview: URL.createObjectURL(file),
            name: file.name,
            originalSize: file.size,
            status: "pending",
        }));
        setImages((prev) => [...prev, ...newImages]);
    }, []);

    const removeImage = (id: string) => {
        setImages((prev) => {
            const img = prev.find((i) => i.id === id);
            if (img?.preview) URL.revokeObjectURL(img.preview);
            if (img?.convertedUrl) URL.revokeObjectURL(img.convertedUrl);
            return prev.filter((i) => i.id !== id);
        });
    };

    const clearAll = () => {
        images.forEach((img) => {
            if (img.preview) URL.revokeObjectURL(img.preview);
            if (img.convertedUrl) URL.revokeObjectURL(img.convertedUrl);
        });
        setImages([]);
    };

    const convertImage = (
        img: ConvertibleImage,
        format: OutputFormat,
        q: number
    ): Promise<{ blob: Blob }> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const image = new Image();

            image.onload = () => {
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;

                // For JPEG, fill white background (no transparency)
                if (format === "jpeg") {
                    ctx!.fillStyle = "#ffffff";
                    ctx!.fillRect(0, 0, canvas.width, canvas.height);
                }

                ctx!.drawImage(image, 0, 0);

                const mimeType = FORMAT_INFO[format].mime;
                const qualityVal = format === "png" ? undefined : q / 100;

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve({ blob });
                        } else {
                            reject(new Error("Conversion failed"));
                        }
                    },
                    mimeType,
                    qualityVal
                );
            };

            image.onerror = () => reject(new Error("Failed to load image"));
            image.src = img.preview;
        });
    };

    const handleConvertAll = async () => {
        setConverting(true);

        // Reset statuses
        setImages((prev) =>
            prev.map((img) =>
                img.status !== "done"
                    ? { ...img, status: "converting" as const }
                    : img
            )
        );

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            if (img.status === "done") continue;

            try {
                const { blob } = await convertImage(img, outputFormat, quality);
                const url = URL.createObjectURL(blob);

                setImages((prev) =>
                    prev.map((item) =>
                        item.id === img.id
                            ? {
                                ...item,
                                status: "done" as const,
                                convertedBlob: blob,
                                convertedSize: blob.size,
                                convertedUrl: url,
                            }
                            : item
                    )
                );
            } catch {
                setImages((prev) =>
                    prev.map((item) =>
                        item.id === img.id
                            ? { ...item, status: "error" as const, error: "Conversion failed" }
                            : item
                    )
                );
            }
        }

        setConverting(false);
    };

    const downloadOne = (img: ConvertibleImage) => {
        if (!img.convertedUrl) return;
        const ext = FORMAT_INFO[outputFormat].ext;
        const baseName = img.name.replace(/\.[^.]+$/, "");
        const a = document.createElement("a");
        a.href = img.convertedUrl;
        a.download = `${baseName}.${ext}`;
        a.click();
    };

    const downloadAll = () => {
        const convertedImages = images.filter((img) => img.status === "done");
        convertedImages.forEach((img, idx) => {
            setTimeout(() => downloadOne(img), idx * 200);
        });
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    };

    const pendingCount = images.filter((i) => i.status === "pending" || i.status === "error").length;
    const doneCount = images.filter((i) => i.status === "done").length;
    const totalSaved = images
        .filter((i) => i.status === "done")
        .reduce((acc, i) => acc + (i.originalSize - (i.convertedSize || 0)), 0);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-xl">
                        <SparklesIcon className="w-7 h-7 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Batch Media Converter</h1>
                        <p className="text-sm text-gray-400">
                            Convert images between formats — instantly, in your browser
                        </p>
                    </div>
                </div>
                {images.length > 0 && (
                    <button
                        className="btn btn-ghost btn-sm text-gray-400 hover:text-red-400"
                        onClick={clearAll}
                    >
                        <Trash2Icon className="w-4 h-4 mr-1" />
                        Clear All
                    </button>
                )}
            </div>

            {/* Format Selection */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                {(Object.keys(FORMAT_INFO) as OutputFormat[]).map((fmt) => {
                    const info = FORMAT_INFO[fmt];
                    const isActive = outputFormat === fmt;
                    return (
                        <button
                            key={fmt}
                            onClick={() => setOutputFormat(fmt)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${isActive
                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                : "border-gray-700/50 bg-gray-800/40 hover:border-gray-600"
                                }`}
                        >
                            <div className={`font-bold text-lg ${isActive ? info.color : "text-gray-300"}`}>
                                {info.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{info.desc}</div>
                        </button>
                    );
                })}
            </div>

            {/* Quality Slider (for WebP / JPG) */}
            {outputFormat !== "png" && (
                <div className="mb-6 bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300 font-medium">Quality</span>
                        <span className="text-sm font-bold text-primary">{quality}%</span>
                    </div>
                    <ElasticSlider
                        defaultValue={quality}
                        min={10}
                        max={100}
                        step={5}
                        onChange={(v) => setQuality(v)}
                        leftIcon={<DiamondIcon />}
                        rightIcon={<SparklesIcon />}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Smaller file</span>
                        <span>Higher quality</span>
                    </div>
                </div>
            )}

            {/* Upload Zone */}
            {images.length === 0 ? (
                <label
                    className="cursor-pointer block"
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                >
                    <div
                        className={`border-2 border-dashed rounded-2xl p-16 flex flex-col items-center gap-4 transition-all ${dragOver
                            ? "border-primary bg-primary/5"
                            : "border-gray-600 hover:border-gray-400"
                            }`}
                    >
                        <div className="p-4 bg-gray-800 rounded-full">
                            <UploadIcon className="w-10 h-10 text-gray-400" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-gray-200 text-lg">
                                Drop images here or click to browse
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Supports PNG, JPG, WebP, GIF, BMP, and more
                            </p>
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && addFiles(e.target.files)}
                    />
                </label>
            ) : (
                <div>
                    {/* Image List */}
                    <div className="space-y-3 mb-6">
                        {images.map((img) => (
                            <div
                                key={img.id}
                                className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${img.status === "done"
                                    ? "bg-green-500/5 border-green-500/20"
                                    : img.status === "error"
                                        ? "bg-red-500/5 border-red-500/20"
                                        : img.status === "converting"
                                            ? "bg-primary/5 border-primary/20"
                                            : "bg-gray-800/40 border-gray-700/50"
                                    }`}
                            >
                                {/* Thumbnail */}
                                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-700/30 shrink-0">
                                    <img
                                        src={img.preview}
                                        alt={img.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate text-gray-200">
                                        {img.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                        <span>{formatBytes(img.originalSize)}</span>
                                        {img.status === "done" && img.convertedSize !== undefined && (
                                            <>
                                                <ArrowRightIcon className="w-3 h-3" />
                                                <span className={
                                                    img.convertedSize < img.originalSize
                                                        ? "text-green-400 font-semibold"
                                                        : "text-yellow-400"
                                                }>
                                                    {formatBytes(img.convertedSize)}
                                                </span>
                                                {img.convertedSize < img.originalSize && (
                                                    <span className="text-green-500">
                                                        (-{Math.round(
                                                            ((img.originalSize - img.convertedSize) /
                                                                img.originalSize) *
                                                            100
                                                        )}%)
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Status / Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {img.status === "converting" && (
                                        <Loader2Icon className="w-5 h-5 animate-spin text-primary" />
                                    )}
                                    {img.status === "done" && (
                                        <>
                                            <CheckCircleIcon className="w-5 h-5 text-green-400" />
                                            <button
                                                className="btn btn-ghost btn-xs btn-circle"
                                                onClick={() => downloadOne(img)}
                                                title="Download"
                                            >
                                                <DownloadIcon className="w-4 h-4 text-primary" />
                                            </button>
                                        </>
                                    )}
                                    {img.status === "error" && (
                                        <AlertCircleIcon className="w-5 h-5 text-red-400" />
                                    )}
                                    <button
                                        className="btn btn-ghost btn-xs btn-circle text-gray-500 hover:text-red-400"
                                        onClick={() => removeImage(img.id)}
                                        title="Remove"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add more + action buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="btn btn-outline btn-sm rounded-xl border-gray-600 hover:bg-gray-700 cursor-pointer">
                            <UploadIcon className="w-4 h-4 mr-2" />
                            Add More
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => e.target.files && addFiles(e.target.files)}
                            />
                        </label>

                        {pendingCount > 0 && (
                            <button
                                className="btn btn-primary btn-sm rounded-xl"
                                onClick={handleConvertAll}
                                disabled={converting}
                            >
                                {converting ? (
                                    <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <SparklesIcon className="w-4 h-4 mr-2" />
                                )}
                                Convert {pendingCount > 0 ? `(${pendingCount})` : "All"} to{" "}
                                {FORMAT_INFO[outputFormat].label}
                            </button>
                        )}

                        {doneCount > 1 && (
                            <button
                                className="btn btn-outline btn-success btn-sm rounded-xl"
                                onClick={downloadAll}
                            >
                                <DownloadIcon className="w-4 h-4 mr-2" />
                                Download All ({doneCount})
                            </button>
                        )}
                    </div>

                    {/* Stats bar */}
                    {doneCount > 0 && (
                        <div className="mt-6 p-4 bg-green-500/5 border border-green-500/10 rounded-xl flex items-center gap-4 text-sm">
                            <CheckCircleIcon className="w-5 h-5 text-green-400 shrink-0" />
                            <div>
                                <span className="text-green-300 font-medium">
                                    {doneCount} image{doneCount > 1 ? "s" : ""} converted
                                </span>
                                {totalSaved > 0 && (
                                    <span className="text-gray-500 ml-2">
                                        · Saved {formatBytes(totalSaved)} total
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Info footer */}
            <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <div className="flex items-start gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-300/70">
                        <strong>100% client-side.</strong> Your images never leave your
                        browser — conversion happens instantly on your device. No uploads,
                        no server processing, completely private.
                    </p>
                </div>
            </div>
        </div>
    );
}
