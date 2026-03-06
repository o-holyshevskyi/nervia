"use client";

import Link from "next/link";
import { FadeIn } from "./FadeIn";
import { Play } from "lucide-react";
import { InteractiveHeroGraph } from "./InteractiveHeroGraph";
import { APP_URL } from "../lib/app-url";

interface HeroProps {
  onWatchDemo?: () => void;
}

export function Hero({ onWatchDemo }: HeroProps) {
  return (
    <div className="relative w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.18),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <FadeIn>
          <span className="inline-block rounded-full border border-white/10 bg-black/25 px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-neutral-300 backdrop-blur-sm">
            Sys.Boot // Evolution of thought
          </span>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span
              className="bg-gradient-to-r from-white via-indigo-200 to-neutral-400 bg-clip-text text-transparent"
              style={{ backgroundSize: "200% auto" }}
            >
              Your Visual Intelligence Universe.
            </span>
          </h1>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-400 md:text-xl">
            Stop organizing notes in flat folders. Build your exocortex with
            interactive 3D neurons, AI-powered clusters, and shared intelligence.
          </p>
        </FadeIn>
        <FadeIn delay={0.3} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={`${APP_URL}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(255,255,255,0.18)] transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:ring-offset-2 focus:ring-offset-black"
          >
            Start Building for Free
          </Link>
          <button
            type="button"
            onClick={() => onWatchDemo?.()}
            className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-black/25 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-black/35 hover:border-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-2 focus:ring-offset-black"
          >
            <Play className="h-4 w-4" />
            Watch Demo
          </button>
        </FadeIn>
        <FadeIn delay={0.4} className="mt-16">
          <InteractiveHeroGraph />
        </FadeIn>
      </div>
    </div>
  );
}
