import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Toaster } from 'sonner';
import Script from 'next/script';

import { getSettings } from "@/app/dashboard/settings/actions";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.appName,
    description: "WiFi Management System",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isProd = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  const midtransUrl = isProd 
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="bottom-right" richColors />
        <Script 
          src={midtransUrl} 
          data-client-key={process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_CLIENT_KEY'} 
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
