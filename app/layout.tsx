import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import ExtensionTokenBroadcast from "@/src/components/ExtensionTokenBroadcast";
import ThemeProvider from "@/src/components/ThemeProvider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const SITE_URL =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof process.env.VERCEL_URL === "string"
        ? `https://${process.env.VERCEL_URL}`
        : "https://nervia.app");

export const metadata: Metadata = {
    title: "Nervia | Your Visual Intelligence Universe",
    description:
        "Build your exocortex. Visualize your thoughts, links, and ideas as an interactive 3D neural network.",
    metadataBase: new URL(SITE_URL),
    openGraph: {
        title: "Nervia | Your Visual Intelligence Universe",
        description:
            "Build your exocortex. Visualize your thoughts, links, and ideas as an interactive 3D neural network.",
        url: SITE_URL,
        siteName: "Nervia",
        images: [{ url: "/banner.png", width: 1200, height: 630, alt: "Nervia 3D knowledge graph" }],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Nervia | Your Visual Intelligence Universe",
        description:
            "Build your exocortex. Visualize your thoughts, links, and ideas as an interactive 3D neural network.",
        images: ["/banner.png"],
    },
    icons: {
        icon: [
            { url: "/brain.svg", type: "image/svg+xml" },
            { url: "/favicon.ico", sizes: "any" },
            { url: "/icon.png", type: "image/png", sizes: "32x32" },
        ],
        apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    suppressHydrationWarning
                    dangerouslySetInnerHTML={{
                        __html: `
(function() {
  try {
    var t = localStorage.getItem('theme');
    var isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
  } catch (e) {}
})();
`,
                    }}
                />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
                suppressHydrationWarning
            >
                <ThemeProvider>
                    <ExtensionTokenBroadcast />
                    {children}
                    <Toaster richColors position="top-right" />
                </ThemeProvider>
            </body>
        </html>
    );
}
