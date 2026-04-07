import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Outfit } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UVA Sage",
  description: "UVA Sage helps engineering students build personalized academic and opportunity plans."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
