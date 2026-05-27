import FloatingChat from "@/components/FloatingChat";

import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "LearnGuard AI — DIU Campus Intelligence",
  description: "AI-powered campus intelligence system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
        <FloatingChat />
      </body>
    </html>
  );
}