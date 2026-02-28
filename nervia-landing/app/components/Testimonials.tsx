"use client";

import { FadeIn } from "./FadeIn";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Finally, my research has a shape. The 3D graph makes connections I would have missed in folders.",
    author: "Dr. Maya Chen",
    role: "Research Lead, BioTech",
  },
  {
    quote:
      "The AI doesn't just search—it surfaces links I didn't know existed. Game-changer for deep work.",
    author: "Alex Rivera",
    role: "Founder, DeepThink",
  },
  {
    quote:
      "We publish our cluster as a shared world. Clients explore our thinking in 3D. Unforgettable.",
    author: "Sam Foster",
    role: "Strategy Director",
  },
];

export function Testimonials() {
  return (
    <section className="relative px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="text-center">
          <p className="text-lg text-slate-400">
            Used by researchers, founders, and deep thinkers.
          </p>
        </FadeIn>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <FadeIn key={t.author} delay={0.1 * (i + 1)}>
              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
                <Quote className="h-10 w-10 text-cyan-400/60" />
                <p className="mt-6 flex-1 text-slate-300">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 border-t border-white/10 pt-4">
                  <p className="font-medium text-white">{t.author}</p>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
