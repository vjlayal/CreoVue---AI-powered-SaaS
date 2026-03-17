"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import {
    VideoIcon,
    DownloadIcon,
    Trash2Icon,
    Loader2Icon,
    CheckCircleIcon,
    AlertCircleIcon,
    ArrowRightIcon,
    PlayCircleIcon,
    XIcon,
} from "lucide-react";

type VideoFormat = "mp4" | "webm" | "avi";

interface ConvertibleVideo {
    id: string;
    file: File;
    name: string;
    originalSize: number;
    status: "pending" | "converting" | "done" | "error";
    progress: number;
    convertedBlob?: Blob;
    convertedSize?: number;
    convertedUrl?: string;
    error?: string;
}

const FORMAT_INFO: Record<
    VideoFormat,
    { label: string; ext: string; mime: string; desc: string; color: string }
> = {
    mp4: {
        label: "MP4",
        ext: "mp4",
        mime: "video/mp4",
        desc: "Universal format",
        color: "text-blue-400",
    },
    webm: {
        label: "WebM",
        ext: "webm",
        mime: "video/webm",
        desc: "Best for web",
        color: "text-green-400",
    },
    avi: {
        label: "AVI",
        ext: "avi",
        mime: "video/x-msvideo",
        desc: "High quality (large)",
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

export default function VideoConverterTab() {
    const [ffmpegLoading, setFfmpegLoading] = useState(true);
    const [ffmpegError, setFfmpegError] = useState("");
    const ffmpegRef = useRef<FFmpeg | null>(null);

    const [videos, setVideos] = useState<ConvertibleVideo[]>([]);
    const [outputFormat, setOutputFormat] = useState<VideoFormat>("mp4");
    const [converting, setConverting] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize FFmpeg on mount
    useEffect(() => {
        const loadFFmpeg = async () => {
            try {
                const ffmpeg = new FFmpeg();
                ffmpegRef.current = ffmpeg;

                // Listen to logs
                ffmpeg.on("log", ({ message }) => {
                    console.log("[FFmpeg]", message);
                });

                // Load basic core (single-threaded default) to avoid SharedArrayBuffer issues
                await ffmpeg.load({
                    coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
                    wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm"
                });

                setFfmpegLoading(false);
            } catch (err: any) {
                console.error("Failed to load FFmpeg:", err);
                setFfmpegError("Failed to load video engine. Please refresh.");
                setFfmpegLoading(false);
            }
        };

        loadFFmpeg();
    }, []);

    const addFiles = useCallback((files: FileList | File[]) => {
        const videoFiles = Array.from(files).filter((f) =>
            f.type.startsWith("video/")
        );
        const newVideos: ConvertibleVideo[] = videoFiles.map((file) => ({
            id: generateId(),
            file,
            name: file.name,
            originalSize: file.size,
            status: "pending",
            progress: 0,
        }));
        setVideos((prev) => [...prev, ...newVideos]);
    }, []);

    const removeVideo = (id: string) => {
        setVideos((prev) => {
            const vid = prev.find((v) => v.id === id);
            if (vid?.convertedUrl) URL.revokeObjectURL(vid.convertedUrl);
            return prev.filter((v) => v.id !== id);
        });
    };

    const clearAll = () => {
        videos.forEach((vid) => {
            if (vid.convertedUrl) URL.revokeObjectURL(vid.convertedUrl);
        });
        setVideos([]);
    };

    const handleConvertAll = async () => {
        const ffmpeg = ffmpegRef.current;
        if (!ffmpeg || ffmpegLoading || ffmpegError) return;

        setConverting(true);

        // Reset statuses for pending ones
        setVideos((prev) =>
            prev.map((vid) =>
                vid.status !== "done"
                    ? { ...vid, status: "converting", progress: 0 }
                    : vid
            )
        );

        for (let i = 0; i < videos.length; i++) {
            const vid = videos[i];
            if (vid.status === "done") continue;

            try {
                // Setup progress listener specifically for this video
                const onProgress = ({ progress, time }: { progress: number; time: number }) => {
                    setVideos((prev) =>
                        prev.map((v) =>
                            v.id === vid.id
                                ? { ...v, progress: Math.max(0, Math.min(100, Math.round(progress * 100))) }
                                : v
                        )
                    );
                };
                ffmpeg.on("progress", onProgress);

                const inputName = `input_${vid.id}.${vid.file.name.split('.').pop()}`;
                const outputName = `output_${vid.id}.${outputFormat}`;

                // Write file to memfs
                await ffmpeg.writeFile(inputName, await fetchFile(vid.file));

                // Execute conversion
                await ffmpeg.exec(["-i", inputName, outputName]);

                // Read output
                const fileData = await ffmpeg.readFile(outputName);
                const data = fileData as Uint8Array;
                
                const blob = new Blob([data as any], { type: FORMAT_INFO[outputFormat].mime });
                const url = URL.createObjectURL(blob);

                setVideos((prev) =>
                    prev.map((item) =>
                        item.id === vid.id
                            ? {
                                ...item,
                                status: "done",
                                progress: 100,
                                convertedBlob: blob,
                                convertedSize: blob.size,
                                convertedUrl: url,
                            }
                            : item
                    )
                );

                // Cleanup memfs
                ffmpeg.off("progress", onProgress);
                await ffmpeg.deleteFile(inputName);
                await ffmpeg.deleteFile(outputName);
            } catch (err) {
                console.error("Conversion error:", err);
                setVideos((prev) =>
                    prev.map((item) =>
                        item.id === vid.id
                            ? { ...item, status: "error", error: "Conversion failed" }
                            : item
                    )
                );
            }
        }

        setConverting(false);
    };

    const downloadOne = (vid: ConvertibleVideo) => {
        if (!vid.convertedUrl) return;
        const ext = FORMAT_INFO[outputFormat].ext;
        const baseName = vid.name.replace(/\.[^.]+$/, "");
        const a = document.createElement("a");
        a.href = vid.convertedUrl;
        a.download = `${baseName}.${ext}`;
        a.click();
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    };

    const pendingCount = videos.filter((v) => v.status === "pending" || v.status === "error").length;
    const doneCount = videos.filter((v) => v.status === "done").length;

    if (ffmpegLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-base-content/10 rounded-2xl bg-base-200/30">
                <Loader2Icon className="w-10 h-10 animate-spin text-purple-400 mb-4" />
                <h3 className="text-xl font-bold bg-linear-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                    Loading Video Engine...
                </h3>
                <p className="text-gray-500 mt-2 text-center max-w-sm">
                    Downloading FFmpeg core (~25MB). This happens only once and runs entirely in your browser.
                </p>
            </div>
        );
    }

    if (ffmpegError) {
        return (
            <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-red-500/20 rounded-2xl bg-red-500/5">
                <AlertCircleIcon className="w-10 h-10 text-red-400 mb-4" />
                <h3 className="text-xl font-bold text-red-300">Engine Load Failed</h3>
                <p className="text-red-400/80 mt-2 text-center">{ffmpegError}</p>
            </div>
        );
    }

    return (
        <div>
            {/* Format Selection & Clear */}
            <div className="flex justify-between items-end mb-6">
                <div className="grid grid-cols-3 gap-3 flex-1 max-w-lg">
                    {(Object.keys(FORMAT_INFO) as VideoFormat[]).map((fmt) => {
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

                {videos.length > 0 && (
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
            {videos.length === 0 ? (
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
                            <VideoIcon className="w-10 h-10 text-gray-400" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-gray-200 text-lg">
                                Drop videos here or click to browse
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Supports MP4, WebM, AVI, MOV, MKV
                            </p>
                            <p className="text-xs text-purple-400/70 mt-3 font-medium flex items-center justify-center gap-1.5">
                                <PlayCircleIcon className="w-3.5 h-3.5" />
                                Processing powered by FFmpeg WebAssembly
                            </p>
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && addFiles(e.target.files)}
                    />
                </label>
            ) : (
                <div className="bg-base-200/20 rounded-2xl p-6 border border-base-content/5">
                    {/* Video List */}
                    <div className="space-y-3 mb-6">
                        {videos.map((vid) => (
                            <div
                                key={vid.id}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${vid.status === "done"
                                    ? "bg-green-500/5 border-green-500/20"
                                    : vid.status === "error"
                                        ? "bg-red-500/5 border-red-500/20"
                                        : vid.status === "converting"
                                            ? "bg-purple-500/5 border-purple-500/20"
                                            : "bg-base-300/40 border-base-content/10"
                                    }`}
                            >
                                {/* Icon / Progress Pie */}
                                <div className="w-12 h-12 rounded-lg bg-base-300 shrink-0 flex items-center justify-center relative">
                                    {vid.status === "converting" ? (
                                        <div 
                                            className="radial-progress text-purple-400 text-[10px] font-bold" 
                                            style={{ "--value": vid.progress, "--size": "2.5rem", "--thickness": "3px" } as any}
                                        >
                                            {vid.progress}%
                                        </div>
                                    ) : (
                                        <VideoIcon className="w-6 h-6 text-gray-500" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate text-gray-200">
                                        {vid.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                        <span>{formatBytes(vid.originalSize)}</span>
                                        {vid.status === "done" && vid.convertedSize !== undefined && (
                                            <>
                                                <ArrowRightIcon className="w-3 h-3" />
                                                <span className={
                                                    vid.convertedSize < vid.originalSize
                                                        ? "text-green-400 font-semibold"
                                                        : "text-amber-400"
                                                }>
                                                    {formatBytes(vid.convertedSize)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Status / Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {vid.status === "done" && (
                                        <>
                                            <CheckCircleIcon className="w-5 h-5 text-green-400" />
                                            <button
                                                className="btn btn-ghost btn-xs btn-circle bg-base-200/50 hover:bg-purple-500/20 text-gray-300"
                                                onClick={() => downloadOne(vid)}
                                                title="Download"
                                            >
                                                <DownloadIcon className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                    {vid.status === "error" && (
                                        <AlertCircleIcon className="w-5 h-5 text-red-400" />
                                    )}
                                    <button
                                        className="btn btn-ghost btn-xs btn-circle bg-base-200/50 hover:bg-red-500/20 hover:text-red-400 text-gray-400"
                                        onClick={() => removeVideo(vid.id)}
                                        title="Remove"
                                        disabled={vid.status === "converting"}
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-3 bg-base-300/30 p-4 rounded-xl border border-base-content/5">
                        <label className={`btn btn-outline btn-sm rounded-lg hover:border-purple-500/50 hover:text-purple-300 ${converting ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
                            <VideoIcon className="w-4 h-4 mr-1" />
                            Add More
                            <input
                                type="file"
                                accept="video/*"
                                multiple
                                className="hidden"
                                onChange={(e) => !converting && e.target.files && addFiles(e.target.files)}
                                disabled={converting}
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
                                    <PlayCircleIcon className="w-4 h-4 mr-2" />
                                )}
                                Convert ({pendingCount}) to {FORMAT_INFO[outputFormat].label}
                            </button>
                        )}
                    </div>
                </div>
            )}
            
            <p className="text-xs text-center text-gray-500 mt-6 max-w-lg mx-auto leading-relaxed">
                Video processing occurs directly in your browser. Larger videos will take more time depending on your device's processing power.
            </p>
        </div>
    );
}
