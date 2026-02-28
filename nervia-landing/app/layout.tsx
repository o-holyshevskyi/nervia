import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nervia – Your Visual Intelligence Universe",
  description:
    "Build your exocortex with interactive 3D neurons, AI-powered clusters, and shared intelligence. Stop organizing notes in flat folders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-slate-950 text-white`}
      >
        {children}
      </body>
    </html>
  );
}
