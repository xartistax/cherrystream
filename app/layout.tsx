import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const description = "Verifizierte Escort- und Erotik-Profile aus der ganzen Schweiz. Diskret, echt, aktuell.";

// Link previews show the same brand image everywhere (app/opengraph-image.png), never a profile photo.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "CherryStream",
    template: "%s | CherryStream",
  },
  description,
  applicationName: "CherryStream",
  openGraph: {
    type: "website",
    siteName: "CherryStream",
    locale: "de_CH",
    title: "CherryStream",
    description,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-svh bg-background font-sans text-foreground antialiased`}>{children}</body>
    </html>
  );
}
