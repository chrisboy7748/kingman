import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { appUrl } from "@/lib/url";
import "./globals.css";

// Polices téléchargées à la compilation et servies par le site : aucune requête vers Google.
const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-bricolage", display: "swap" });
const sans = Figtree({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-figtree", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  openGraph: { type: "website", locale: "fr_FR", siteName: "Allégo" },
  title: { default: "Allégo — Perdre du poids à son rythme", template: "%s · Allégo" },
  description:
    "Allégo calcule vos besoins, suit votre poids et vous propose chaque semaine des menus, des exercices et une habitude à prendre.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#2f6b45" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
