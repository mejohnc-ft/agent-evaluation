import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://agent-evaluation-five.vercel.app"),
  title: { default: "Cadre AI Assistant", template: "%s · Cadre AI Assistant" },
  description: "Ask about Cadre AI's services, industries, and how to work with the team.",
  openGraph: {
    title: "Cadre AI Assistant",
    description: "Ask about Cadre AI's services, industries, and how to work with the team.",
    type: "website",
    siteName: "Cadre AI Assistant",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: false, follow: false }, // demo deployment
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // lets env(safe-area-inset-*) report the notch and home indicator
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0c0d" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-dvh flex-col bg-surface font-sans text-ink">{children}</body>
    </html>
  );
}
