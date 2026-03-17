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
} from "lucide-react";

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
        desc: "Best for websites",
        color: "text-green-400",
    },
    png: {
        label: "PNG",
        ext: "png",
        mime: "image/png",
        desc: "Lossless quality",
        color: "text-blue-400",
    },
    jpeg: {
        label: "JPG",
        ext: "jpg",
        mime: "image/jpeg",
        desc: "Universal format",
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

export default function ImageConverterTab() {
    const [images, setImages] = useState<ConvertibleImage[]>([]);
    const [outputFormat, setOutputFormat] = useState<OutputFormat>("webp");
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
        q: number = 85
    ): Promise<{ blob: Blob }> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const image = new Image();

            image.onload = () => {
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;

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
                const { blob } = await convertImage(img, outputFormat);
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
        <div>
            {/* Format Selection & Clear */}
            <div className="flex justify-between items-end mb-6">
                <div className="grid grid-cols-3 gap-3 flex-1 max-w-lg">
                    {(Object.keys(FORMAT_INFO) as OutputFormat[]).map((fmt) => {
                        const info = FORMAT_INFO[fmt];
                        const isActive = outputFormat === fmt;
                        return (
                            <button
                                key={fmt}
                                onClick={() => setOutputFormat(fmt)}
                                className={`p-3 rounded-xl border transition-all text-center ${isActive
                                    ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                                    : "bg-base-200/50 border-base-content/10 text-gray-400 hover:border-base-content/20 hover:text-gray-300"
                                    }`}
                            >
                                <div className="font-bold text-lg leading-tight">{info.label}</div>
                                <div className="text-[10px] opacity-70 mt-0.5">{info.desc}</div>
                            </button>
                        );
                    })}
                </div>

                {images.length > 0 && (
                    <button
                        className="btn btn-ghost btn-sm text-gray-400 hover:text-red-400 ml-4 mb-1 border border-base-content/10 bg-base-200/50 rounded-lg"
                        onClick={clearAll}
                    >
                        <Trash2Icon className="w-4 h-4 mr-1.5" />
                        Clear All
                    </button>
                )}
            </div>

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
                            ? "border-purple-500 bg-purple-500/5"
                            : "border-base-content/20 hover:border-base-content/40 hover:bg-base-200/30 bg-base-200/10"
                            }`}
                    >
                        <div className="p-4 bg-base-300 rounded-full">
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
                <div className="bg-base-200/20 rounded-2xl p-6 border border-base-content/5">
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
                                            ? "bg-purple-500/5 border-purple-500/20"
                                            : "bg-base-300/40 border-base-content/10"
                                    }`}
                            >
                                {/* Thumbnail */}
                                <div className="w-14 h-14 rounded-lg overflow-hidden bg-base-300 shrink-0">
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
                                                        : "text-amber-400"
                                                }>
                                                    {formatBytes(img.convertedSize)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Status / Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {img.status === "converting" && (
                                        <Loader2Icon className="w-5 h-5 animate-spin text-purple-400" />
                                    )}
                                    {img.status === "done" && (
                                        <>
                                            <CheckCircleIcon className="w-5 h-5 text-green-400" />
                                            <button
                                                className="btn btn-ghost btn-xs btn-circle bg-base-200/50 hover:bg-purple-500/20 text-gray-300"
                                                onClick={() => downloadOne(img)}
                                                title="Download"
                                            >
                                                <DownloadIcon className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                    {img.status === "error" && (
                                        <AlertCircleIcon className="w-5 h-5 text-red-400" />
                                    )}
                                    <button
                                        className="btn btn-ghost btn-xs btn-circle bg-base-200/50 hover:bg-red-500/20 hover:text-red-400 text-gray-400"
                                        onClick={() => removeImage(img.id)}
                                        title="Remove"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-3 bg-base-300/30 p-4 rounded-xl border border-base-content/5">
                        <label className="btn btn-outline btn-sm rounded-lg hover:border-purple-500/50 hover:text-purple-300 cursor-pointer">
                            <UploadIcon className="w-4 h-4 mr-1" />
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
                                className="btn btn-sm rounded-lg bg-linear-to-r from-purple-500 to-indigo-500 text-white border-0 shadow-[0_0_15px_rgba(167,139,250,0.3)] hover:shadow-[0_0_20px_rgba(167,139,250,0.5)] transition-all hover:scale-105 active:scale-95"
                                onClick={handleConvertAll}
                                disabled={converting}
                            >
                                {converting ? (
                                    <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <SparklesIcon className="w-4 h-4 mr-2" />
                                )}
                                Convert ({pendingCount}) to {FORMAT_INFO[outputFormat].label}
                            </button>
                        )}

                        {doneCount > 1 && (
                            <button
                                className="btn btn-sm rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20"
                                onClick={downloadAll}
                            >
                                <DownloadIcon className="w-4 h-4 mr-1.5" />
                                Download All
                            </button>
                        )}
                        
                        {/* Stats inline */}
                        {doneCount > 0 && (
                            <div className="ml-auto text-xs font-medium text-green-400/80 flex items-center gap-2">
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                {doneCount} converted 
                                {totalSaved > 0 && ` (saved ${formatBytes(totalSaved)})`}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
