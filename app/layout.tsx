import type { Metadata } from "next";
import { Anton, Pinyon_Script, Inter, JetBrains_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const script = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const label = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-label",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.criticsarchive.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "CRITICS ARCHIVE — SWAG IS ART",
  description:
    "CRITICS ARCHIVE. A small, curated streetwear catalogue. We don't follow culture — we archive it. Drop 001, SS26. SWAG IS ART.",
  keywords: [
    "CRITICS ARCHIVE",
    "streetwear",
    "SWAG IS ART",
    "Drop 001",
    "SS26",
    "Nigeria",
    "Lagos",
    "curated fashion",
  ],
  authors: [{ name: "CRITICS ARCHIVE" }],
  creator: "CRITICS ARCHIVE",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "CRITICS ARCHIVE",
    title: "CRITICS ARCHIVE — SWAG IS ART",
    description:
      "A small, curated streetwear catalogue. We don't follow culture — we archive it. SWAG IS ART.",
    locale: "en_US",
    images: [
      {
        url: "/critics-archive-wordmark.png",
        alt: "CRITICS ARCHIVE — SWAG IS ART",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CRITICS ARCHIVE — SWAG IS ART",
    description: "A small, curated streetwear catalogue. SWAG IS ART.",
    images: ["/critics-archive-wordmark.png"],
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${script.variable} ${body.variable} ${label.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
