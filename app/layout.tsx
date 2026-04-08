import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server';
import { getUserTier } from "@/lib/subscription";
import { TierProvider } from "@/components/TierProvider";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CreoVue",
  description: "CreoVue - video SaaS powered by Cloudinary",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  const tier = userId ? await getUserTier(userId) : "basic";

  return (
    <ClerkProvider>
      <html lang="en" data-theme="dark" className={`theme-${tier}`}>
        <head>
          <meta name="google-site-verification" content="7AE83NTJUIt-MST0AjbX8HM3ejyOhcZE6Ti6egiVPQI" />
        </head>
        <body className={inter.className}>
          <TierProvider tier={tier}>
            {children}
            <Analytics />
          </TierProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

