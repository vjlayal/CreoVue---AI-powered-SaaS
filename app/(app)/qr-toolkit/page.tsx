"use client";

import React, { useState, useRef, useCallback } from "react";
import FeatureGate from "@/components/FeatureGate";
import { QRCodeCanvas } from "qrcode.react";
import {
    QrCodeIcon,
    DownloadIcon,
    PlusIcon,
    Trash2Icon,
    PaletteIcon,
    CopyIcon,
    CheckIcon,
    InstagramIcon,
    YoutubeIcon,
    TwitterIcon,
    LinkIcon,
    GlobeIcon,
    MinimizeIcon,
    MaximizeIcon,
} from "lucide-react";
import ElasticSlider from "@/components/ElasticSlider";

interface SocialLink {
    id: string;
    platform: string;
    url: string;
    icon: React.ElementType;
}

const PLATFORM_OPTIONS = [
    { value: "instagram", label: "Instagram", icon: InstagramIcon, prefix: "https://instagram.com/" },
    { value: "youtube", label: "YouTube", icon: YoutubeIcon, prefix: "https://youtube.com/@" },
    { value: "twitter", label: "X (Twitter)", icon: TwitterIcon, prefix: "https://x.com/" },
    { value: "website", label: "Website", icon: GlobeIcon, prefix: "https://" },
    { value: "custom", label: "Custom Link", icon: LinkIcon, prefix: "" },
];

const PRESET_COLORS = [
    { fg: "#ffffff", bg: "#000000", name: "Classic" },
    { fg: "#0ea5e9", bg: "#0c0a09", name: "Cyan Night" },
    { fg: "#a855f7", bg: "#1a0a2e", name: "Purple" },
    { fg: "#f97316", bg: "#1c1917", name: "Ember" },
    { fg: "#22c55e", bg: "#052e16", name: "Matrix" },
    { fg: "#ec4899", bg: "#1a0010", name: "Pink" },
    { fg: "#eab308", bg: "#1c1a00", name: "Gold" },
    { fg: "#ffffff", bg: "#1e40af", name: "Ocean" },
];

function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

export default function QRCodePage() {
    const [links, setLinks] = useState<SocialLink[]>([
        { id: generateId(), platform: "instagram", url: "", icon: InstagramIcon },
    ]);
    const [selectedLinkId, setSelectedLinkId] = useState<string>(links[0].id);
    const [fgColor, setFgColor] = useState("#ffffff");
    const [bgColor, setBgColor] = useState("#000000");
    const [qrSize, setQrSize] = useState(256);
    const [copied, setCopied] = useState(false);
    const qrRef = useRef<HTMLDivElement>(null);

    const selectedLink = links.find((l) => l.id === selectedLinkId) || links[0];

    const getFullUrl = useCallback(
        (link: SocialLink) => {
            const platform = PLATFORM_OPTIONS.find((p) => p.value === link.platform);
            if (!platform || link.platform === "custom" || link.platform === "website") {
                return link.url.startsWith("http") ? link.url : `https://${link.url}`;
            }
            // If user pasted a full URL, use it as-is
            if (link.url.startsWith("http")) return link.url;
            return `${platform.prefix}${link.url}`;
        },
        []
    );

    const addLink = () => {
        const newLink: SocialLink = {
            id: generateId(),
            platform: "instagram",
            url: "",
            icon: InstagramIcon,
        };
        setLinks((prev) => [...prev, newLink]);
        setSelectedLinkId(newLink.id);
    };

    const removeLink = (id: string) => {
        if (links.length <= 1) return;
        setLinks((prev) => prev.filter((l) => l.id !== id));
        if (selectedLinkId === id) {
            setSelectedLinkId(links.find((l) => l.id !== id)?.id || links[0].id);
        }
    };

    const updateLink = (id: string, field: Partial<SocialLink>) => {
        setLinks((prev) =>
            prev.map((l) => (l.id === id ? { ...l, ...field } : l))
        );
    };

    const updatePlatform = (id: string, platformValue: string) => {
        const platform = PLATFORM_OPTIONS.find((p) => p.value === platformValue);
        updateLink(id, {
            platform: platformValue,
            icon: platform?.icon || LinkIcon,
        });
    };

    const downloadQR = (format: "png" | "svg") => {
        if (!qrRef.current) return;
        const canvas = qrRef.current.querySelector("canvas");
        if (!canvas) return;

        if (format === "png") {
            const url = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = url;
            a.download = `qr-${selectedLink.platform}-${Date.now()}.png`;
            a.click();
        }
    };

    const copyQRToClipboard = async () => {
        if (!qrRef.current) return;
        const canvas = qrRef.current.querySelector("canvas");
        if (!canvas) return;

        try {
            const blob = await new Promise<Blob>((resolve) =>
                canvas.toBlob((b) => resolve(b!), "image/png")
            );
            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
            ]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback — clipboard API not available
        }
    };

    const currentUrl = getFullUrl(selectedLink);
    const hasValidUrl = selectedLink.url.trim().length > 0;

    return (
        <FeatureGate>
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-cyan-500/10 rounded-xl">
                    <QrCodeIcon className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">QR Code Toolkit</h1>
                    <p className="text-sm text-gray-400">
                        Generate styled QR codes for your social media handles & links
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left — Link Editor */}
                <div className="space-y-4">
                    {/* Social Links */}
                    <div className="card bg-gray-800/60 border border-gray-700/50 rounded-2xl p-5">
                        <h3 className="font-semibold text-sm text-gray-300 mb-4 flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" />
                            Your Links
                        </h3>

                        <div className="space-y-3">
                            {links.map((link) => {
                                const Icon = link.icon;
                                return (
                                    <div
                                        key={link.id}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedLinkId === link.id
                                            ? "border-primary bg-primary/5"
                                            : "border-gray-700/50 hover:border-gray-600"
                                            }`}
                                        onClick={() => setSelectedLinkId(link.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-5 h-5 text-gray-400 shrink-0" />
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <select
                                                    className="select select-sm select-bordered w-full bg-gray-900 border-gray-700 text-sm rounded-lg"
                                                    value={link.platform}
                                                    onChange={(e) =>
                                                        updatePlatform(link.id, e.target.value)
                                                    }
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {PLATFORM_OPTIONS.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="text"
                                                    className="input input-sm input-bordered w-full bg-gray-900 border-gray-700 text-sm rounded-lg"
                                                    placeholder={
                                                        link.platform === "custom"
                                                            ? "https://your-link.com"
                                                            : link.platform === "website"
                                                                ? "yoursite.com"
                                                                : `your_handle`
                                                    }
                                                    value={link.url}
                                                    onChange={(e) =>
                                                        updateLink(link.id, { url: e.target.value })
                                                    }
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                            {links.length > 1 && (
                                                <button
                                                    className="btn btn-ghost btn-xs btn-circle text-gray-500 hover:text-red-400 shrink-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeLink(link.id);
                                                    }}
                                                >
                                                    <Trash2Icon className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        {selectedLinkId === link.id && link.url && (
                                            <p className="text-xs text-gray-500 mt-2 truncate pl-8">
                                                → {getFullUrl(link)}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            className="btn btn-ghost btn-sm w-full mt-3 text-gray-400 border-dashed border border-gray-700 rounded-xl hover:bg-gray-700/30"
                            onClick={addLink}
                        >
                            <PlusIcon className="w-4 h-4 mr-1" />
                            Add Link
                        </button>
                    </div>

                    {/* Style Options */}
                    <div className="card bg-gray-800/60 border border-gray-700/50 rounded-2xl p-5">
                        <h3 className="font-semibold text-sm text-gray-300 mb-4 flex items-center gap-2">
                            <PaletteIcon className="w-4 h-4" />
                            Style
                        </h3>

                        {/* Color Presets */}
                        <p className="text-xs text-gray-500 mb-2">Color Presets</p>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {PRESET_COLORS.map((preset) => (
                                <button
                                    key={preset.name}
                                    className={`p-2 rounded-lg border text-center transition-all ${fgColor === preset.fg && bgColor === preset.bg
                                        ? "border-primary ring-1 ring-primary/30"
                                        : "border-gray-700/50 hover:border-gray-600"
                                        }`}
                                    onClick={() => {
                                        setFgColor(preset.fg);
                                        setBgColor(preset.bg);
                                    }}
                                >
                                    <div
                                        className="w-full aspect-square rounded-md mb-1 border border-gray-700/30"
                                        style={{
                                            background: `linear-gradient(135deg, ${preset.fg} 50%, ${preset.bg} 50%)`,
                                        }}
                                    />
                                    <span className="text-[10px] text-gray-500">
                                        {preset.name}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Custom Colors */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">
                                    QR Color
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={fgColor}
                                        onChange={(e) => setFgColor(e.target.value)}
                                        className="w-8 h-8 rounded cursor-pointer border-0"
                                    />
                                    <input
                                        type="text"
                                        value={fgColor}
                                        onChange={(e) => setFgColor(e.target.value)}
                                        className="input input-sm input-bordered flex-1 bg-gray-900 border-gray-700 text-xs font-mono rounded-lg"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">
                                    Background
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={bgColor}
                                        onChange={(e) => setBgColor(e.target.value)}
                                        className="w-8 h-8 rounded cursor-pointer border-0"
                                    />
                                    <input
                                        type="text"
                                        value={bgColor}
                                        onChange={(e) => setBgColor(e.target.value)}
                                        className="input input-sm input-bordered flex-1 bg-gray-900 border-gray-700 text-xs font-mono rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Size */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs text-gray-500">Size</label>
                                <span className="text-xs text-gray-400 font-mono">
                                    {qrSize}px
                                </span>
                            </div>
                            <ElasticSlider
                                defaultValue={qrSize}
                                min={128}
                                max={320}
                                step={32}
                                onChange={(v) => setQrSize(v)}
                                leftIcon={<MinimizeIcon />}
                                rightIcon={<MaximizeIcon />}
                            />
                        </div>
                    </div>
                </div>

                {/* Right — QR Preview */}
                <div className="space-y-4">
                    <div className="card bg-gray-800/60 border border-gray-700/50 rounded-2xl p-6 flex flex-col items-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-4">
                            Preview
                        </p>

                        {hasValidUrl ? (
                            <div
                                ref={qrRef}
                                className="p-6 rounded-2xl max-w-full overflow-hidden"
                                style={{ backgroundColor: bgColor }}
                            >
                                <QRCodeCanvas
                                    value={currentUrl}
                                    size={qrSize}
                                    fgColor={fgColor}
                                    bgColor={bgColor}
                                    level="H"
                                    marginSize={2}
                                />
                            </div>
                        ) : (
                            <div className="w-64 h-64 rounded-2xl bg-gray-900/40 border-2 border-dashed border-gray-700 flex flex-col items-center justify-center gap-2">
                                <QrCodeIcon className="w-12 h-12 text-gray-700" />
                                <p className="text-sm text-gray-600 text-center px-4">
                                    Enter a handle or URL to generate a QR code
                                </p>
                            </div>
                        )}

                        {/* Link display */}
                        {hasValidUrl && (
                            <p className="text-xs text-gray-500 mt-3 text-center break-all max-w-xs">
                                {currentUrl}
                            </p>
                        )}
                    </div>

                    {/* Download actions */}
                    {hasValidUrl && (
                        <div className="flex gap-3">
                            <button
                                className="btn btn-primary btn-sm rounded-xl flex-1"
                                onClick={() => downloadQR("png")}
                            >
                                <DownloadIcon className="w-4 h-4 mr-2" />
                                Download PNG
                            </button>
                            <button
                                className="btn btn-outline btn-sm rounded-xl flex-1 border-gray-600 hover:bg-gray-700"
                                onClick={copyQRToClipboard}
                            >
                                {copied ? (
                                    <>
                                        <CheckIcon className="w-4 h-4 mr-2 text-green-400" />
                                        <span className="text-green-400">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <CopyIcon className="w-4 h-4 mr-2" />
                                        Copy to Clipboard
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Tip */}
                    <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl">
                        <p className="text-xs text-cyan-300/70">
                            <strong>Tip:</strong> Use the &quot;H&quot; error correction level for QR codes
                            that will be printed — they stay scannable even if slightly
                            damaged. Add multiple links and generate a separate QR for each!
                        </p>
                    </div>
                </div>
            </div>
        </div>
        </FeatureGate>
    );
}
