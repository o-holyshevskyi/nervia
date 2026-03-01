"use client";

import Link from "next/link";
import { FadeIn } from "./FadeIn";
import { Play } from "lucide-react";
import { NeuralBackground } from "./NeuralBackground";
import { InteractiveHeroGraph } from "./InteractiveHeroGraph";
import { APP_URL } from "../lib/app-url";

interface HeroProps {
  onWatchDemo?: () => void;
}

export function Hero({ onWatchDemo }: HeroProps) {
  return (
    <section className="relative px-6 pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
      <NeuralBackground />
      <div className="relative z-10 mx-auto max-w-4xl text-center pointer-events-none">
        <FadeIn>
          <span className="inline-block rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-sm text-slate-300 backdrop-blur-sm">
            Welcome to the evolution of thought.
          </span>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span
              className="bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"
              style={{ backgroundSize: "200% auto" }}
            >
              Your Visual Intelligence Universe.
            </span>
          </h1>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 md:text-xl">
            Stop organizing notes in flat folders. Build your exocortex with
            interactive 3D neurons, AI-powered clusters, and shared intelligence.
          </p>
        </FadeIn>
        <FadeIn delay={0.3} className="mt-10 flex flex-wrap items-center justify-center gap-4 pointer-events-auto">
          <Link
            href={`${APP_URL}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Start Building for Free
          </Link>
          <button
            type="button"
            onClick={() => onWatchDemo?.()}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/[0.06] hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <Play className="h-4 w-4" />
            Watch Demo
          </button>
        </FadeIn>
        <FadeIn delay={0.4} className="mt-16">
          <InteractiveHeroGraph />
        </FadeIn>
      </div>
    </section>
  );
}
