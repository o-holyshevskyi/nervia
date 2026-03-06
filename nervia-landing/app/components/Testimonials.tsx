"use client";

import { FadeIn } from "./FadeIn";

export function Testimonials() {
  return (
    <div className="relative w-full" aria-labelledby="founder-note-heading">
      <div className="mx-auto max-w-4xl">
        <FadeIn>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-8 backdrop-blur-sm shadow-[0_0_60px_rgba(99,102,241,0.10)] md:p-12">
            <h2
              id="founder-note-heading"
              className="font-mono text-[10px] md:text-xs uppercase tracking-[0.22em] text-neutral-400"
            >
              Sys.Req // origin
            </h2>
            <p className="mt-3 text-2xl md:text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500">
              Why I built Nervia
            </p>
            <p className="mt-6 text-lg leading-relaxed text-neutral-300 md:text-xl">
              I was tired of losing my best ideas in endless folders. I wanted a tool that
              worked the way my brain actually works - through connections and visual patterns. I
              built Nervia to be my personal exocortex. Now, I&apos;m opening the universe for
              you to build yours.
            </p>
            <p className="mt-8 font-mono text-xs uppercase tracking-widest text-neutral-500">
              - Founder of Nervia
            </p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
