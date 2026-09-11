import type { Metadata } from "next";
import "./globals.css";
import { wedding } from "@/config/wedding";

export const metadata: Metadata = {
  title: `${wedding.couple} — Nuestra boda`,
  description: `${wedding.dateLabel} · ${wedding.venue}, ${wedding.city}`,
  openGraph: { images: ["/photos/01-beso-atardecer.jpg"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Roboto+Condensed:ital,wght@0,300;0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
