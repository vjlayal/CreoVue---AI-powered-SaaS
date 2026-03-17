import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server';
import { getUserTier } from "@/lib/subscription";
import { TierProvider } from "@/components/TierProvider";

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
        <body className={inter.className}>
          <TierProvider tier={tier}>
            {children}
          </TierProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

