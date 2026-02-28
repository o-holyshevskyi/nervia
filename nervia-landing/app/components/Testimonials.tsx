"use client";

import { FadeIn } from "./FadeIn";

export function Testimonials() {
  return (
    <section className="relative px-6 py-24 md:py-32" aria-labelledby="founder-note-heading">
      <div className="mx-auto max-w-4xl">
        <FadeIn>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl md:p-12">
            <h2
              id="founder-note-heading"
              className="text-lg font-medium uppercase tracking-wider text-cyan-400/90"
            >
              Why I built Nervia
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-300 md:text-xl">
              I was tired of losing my best ideas in endless folders. I wanted a tool that
              worked the way my brain actually works - through connections and visual patterns. I
              built Nervia to be my personal exocortex. Now, I&apos;m opening the universe for
              you to build yours.
            </p>
            <p className="mt-8 text-slate-500">- Founder of Nervia</p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
