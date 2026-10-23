import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Allégo — Perdre du poids à son rythme", template: "%s · Allégo" },
  description:
    "Allégo calcule vos besoins, suit votre poids et vous propose chaque semaine des menus, des exercices et une habitude à prendre.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#2f6b45" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Figtree:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
