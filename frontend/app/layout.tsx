import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "StoneVision AI - Granite Intelligence",
  description: "AI-powered granite block analysis for Melur-Madurai exporters. Multilingual PDF catalogs, physical audit scheduling, and buyer trust gateway.",
  keywords: ["granite", "export", "melur", "madurai", "AI", "audit", "PDF"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0908",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Outfit:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Manrope:wght@300;400;500&display=swap" rel="stylesheet"/>
      </head>
      <body style={{background:"#0a0908",minHeight:"100vh"}}>
        {/* MODULE 2: LangProvider wraps entire app — language state available everywhere */}
        <LangProvider>
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
