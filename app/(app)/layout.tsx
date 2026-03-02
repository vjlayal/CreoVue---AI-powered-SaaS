"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  LogOutIcon,
  MenuIcon,
  LayoutDashboardIcon,
  Share2Icon,
  UploadIcon,
  ImageIcon,
  CrownIcon,
  SettingsIcon,
  RepeatIcon,
  QrCodeIcon,
} from "lucide-react";
import dynamic from "next/dynamic";

const Prism = dynamic(() => import("@/components/Prism"), { ssr: false });

const sidebarItems = [
  { href: "/home", icon: LayoutDashboardIcon, label: "Home Page" },
  { href: "/social-share", icon: Share2Icon, label: "Social Share" },
  { href: "/video-upload", icon: UploadIcon, label: "Video Upload" },
  { href: "/media-converter", icon: RepeatIcon, label: "Media Converter" },
  { href: "/qr-toolkit", icon: QrCodeIcon, label: "QR Toolkit" },
  { href: "/settings", icon: SettingsIcon, label: "Settings" },
];

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleLogoClick = () => {
    router.push("/");
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="drawer lg:drawer-open" style={{ position: "relative", minHeight: "100vh" }}>
      {/* Prism Background — fills entire viewport behind everything */}
      {/* Prism WebGL Background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <Prism
          animationType="rotate"
          hueShift={220}
          glow={0.35}
          bloom={0.5}
          noise={0.2}
          scale={4.0}
          colorFrequency={1.0}
          timeScale={0.3}
          transparent={false}
        />
        {/* Dark overlay to tone down the prism and keep it subtle */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(8, 8, 18, 0.55)",
            pointerEvents: "none",
          }}
        />
      </div>

      <input
        id="sidebar-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={sidebarOpen}
        onChange={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="drawer-content flex flex-col" style={{ position: "relative", zIndex: 1 }}>
        {/* Glassmorphism Navbar */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(10, 10, 22, 0.88)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            boxShadow: "0 4px 30px rgba(0, 0, 0, 0.4)",
            willChange: "transform",
          }}
        >
          <div className="navbar max-w-full mx-auto px-4 sm:px-6 lg:px-8 gap">
            <div className="flex-none lg:hidden">
              <label
                htmlFor="sidebar-drawer"
                className="btn btn-square btn-ghost drawer-button text-white/80 hover:text-white hover:bg-white/10"
              >
                <MenuIcon />
              </label>
            </div>
            <div className="flex-1">
              <Link href="/" onClick={handleLogoClick}>
                <div
                  className="normal-case text-4xl p-5 font-bold tracking-tight cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #fff 0%, #a78bfa 50%, #818cf8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  CreoVue Showcase
                </div>
              </Link>
            </div>
            <div className="flex-none flex items-center space-x-4">
              {user && (
                <>
                  <div className="avatar">
                    <div
                      className="w-9 h-9 rounded-full"
                      style={{
                        border: "2px solid rgba(167, 139, 250, 0.5)",
                        padding: "1px",
                      }}
                    >
                      <img
                        src={user.imageUrl}
                        alt={
                          user.username || user.emailAddresses[0].emailAddress
                        }
                        className="rounded-full"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm truncate max-w-xs lg:max-w-md text-white/90 font-medium">
                      {user.username || user.emailAddresses[0].emailAddress}
                    </span>
                    <span className="text-xs text-violet-300/70">
                      Plan: {(user as any)?.publicMetadata?.plan ?? "Free"}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="btn btn-ghost btn-circle text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    <LogOutIcon className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          style={{
            flexGrow: 1,
            minHeight: "100vh",
            position: "relative",
          }}
        >
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 my-8 text-white">
            {children}
          </div>
        </main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side" style={{ zIndex: 40 }}>
        <label htmlFor="sidebar-drawer" className="drawer-overlay"></label>
        <aside
          className="w-64 h-full flex flex-col"
          style={{
            background: "rgba(8, 8, 18, 0.92)",
            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
            boxShadow: "4px 0 30px rgba(0, 0, 0, 0.4)",
            willChange: "transform",
          }}
        >
          {/* Sidebar Logo */}
          <div className="flex items-center justify-center py-6">
            <div
              style={{
                background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.15))",
                borderRadius: "16px",
                padding: "12px",
                border: "1px solid rgba(139, 92, 246, 0.2)",
                boxShadow: "0 0 20px rgba(139, 92, 246, 0.15)",
              }}
            >
              <ImageIcon className="w-8 h-8 text-violet-400" />
            </div>
          </div>

          {/* Navigation Items */}
          <ul className="menu p-4 w-full grow gap-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200"
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(99, 102, 241, 0.15))"
                        : "transparent",
                      border: isActive
                        ? "1px solid rgba(139, 92, 246, 0.3)"
                        : "1px solid transparent",
                      boxShadow: isActive
                        ? "0 0 15px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                        : "none",
                      color: isActive
                        ? "#e0d5ff"
                        : "rgba(200, 200, 220, 0.7)",
                    }}
                    onClick={() => setSidebarOpen(false)}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background =
                          "rgba(255, 255, 255, 0.05)";
                        (e.currentTarget as HTMLElement).style.border =
                          "1px solid rgba(255, 255, 255, 0.08)";
                        (e.currentTarget as HTMLElement).style.color =
                          "rgba(230, 230, 240, 0.9)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background =
                          "transparent";
                        (e.currentTarget as HTMLElement).style.border =
                          "1px solid transparent";
                        (e.currentTarget as HTMLElement).style.color =
                          "rgba(200, 200, 220, 0.7)";
                      }
                    }}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}

            {/* Premium Plans Button */}
            <li className="mt-4">
              <Link
                href="/subscription"
                className="flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, rgba(250, 204, 21, 0.85), rgba(245, 158, 11, 0.85))",
                  color: "#1a1a2e",
                  border: "1px solid rgba(250, 204, 21, 0.3)",
                  boxShadow: "0 0 20px rgba(250, 204, 21, 0.15)",
                }}
                onClick={() => setSidebarOpen(false)}
              >
                <CrownIcon className="w-5 h-5" />
                <span>Premium Plans</span>
              </Link>
            </li>
          </ul>

          {/* Sign Out Button */}
          {user && (
            <div className="p-4">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "rgba(200, 200, 220, 0.7)",
                  backdropFilter: "blur(10px)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(239, 68, 68, 0.15)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(239, 68, 68, 0.3)";
                  (e.currentTarget as HTMLElement).style.color =
                    "rgba(252, 165, 165, 0.9)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255, 255, 255, 0.05)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(255, 255, 255, 0.1)";
                  (e.currentTarget as HTMLElement).style.color =
                    "rgba(200, 200, 220, 0.7)";
                }}
              >
                <LogOutIcon className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
