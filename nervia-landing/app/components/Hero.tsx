"use client";

import Link from "next/link";
import { FadeIn } from "./FadeIn";
import { Play } from "lucide-react";

export function Hero() {
  return (
    <section className="relative px-6 pt-20 pb-24 md:pt-28 md:pb-32">
      <div className="mx-auto max-w-4xl text-center">
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
        <FadeIn delay={0.3} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="https://synapse-bookmark-ten.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Start Building for Free
          </Link>
          <Link
            href="#"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/[0.06] hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <Play className="h-4 w-4" />
            Watch Demo
          </Link>
        </FadeIn>
        <FadeIn delay={0.4} className="mt-16">
          <div
            className="mx-auto aspect-video max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-2xl"
            style={{
              boxShadow:
                "0 0 60px rgba(6,182,212,0.15), 0 0 80px rgba(168,85,247,0.1), inset 0 0 0 1px rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900/80 to-slate-950/80">
              <div className="grid grid-cols-3 gap-2 p-8">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur-sm"
                  />
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
