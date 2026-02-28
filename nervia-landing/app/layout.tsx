import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://synapse-bookmark-ten.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Nervia – Your Visual Intelligence Universe",
  description:
    "Build your exocortex with interactive 3D neurons, AI-powered clusters, and shared intelligence. Stop organizing notes in flat folders.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Nervia – Your Visual Intelligence Universe",
    description:
      "Build your exocortex with interactive 3D neurons, AI-powered clusters, and shared intelligence. Stop organizing notes in flat folders.",
    url: siteUrl,
    siteName: "Nervia",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "Nervia – Your Visual Intelligence Universe",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nervia – Your Visual Intelligence Universe",
    description:
      "Build your exocortex with interactive 3D neurons, AI-powered clusters, and shared intelligence.",
    images: ["/banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-slate-950 text-white`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
