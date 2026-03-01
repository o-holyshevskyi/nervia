"use client";

import Link from "next/link";
import Image from "next/image";
import { APP_URL } from "../lib/app-url";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/[0.03] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white"
        >
          <Image
            src="/icon.png"
            alt="Nervia"
            width={28}
            height={28}
            className="h-7 w-7 shrink-0"
          />
          Nervia
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          <Link
            href="#features"
            className="text-sm text-slate-300 transition-colors hover:text-white"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-sm text-slate-300 transition-colors hover:text-white"
          >
            Pricing
          </Link>
          <Link
            href="#faq"
            className="text-sm text-slate-300 transition-colors hover:text-white"
          >
            FAQ
          </Link>
        </nav>
        <Link
          href={`${APP_URL}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] transition hover:border-purple-400/40 hover:bg-purple-500/10 hover:shadow-[0_0_24px_rgba(168,85,247,0.2)] focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          Enter Universe
        </Link>
      </div>
    </header>
  );
}
