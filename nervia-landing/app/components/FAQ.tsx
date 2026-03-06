"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn } from "./FadeIn";
import { ArrowRight, ChevronRight } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { HolographicCard } from "./HolographicCard";

const faqs = [
  {
    q: "What is a Neuron?",
    slug: "what-is-a-neuron",
    a: "A Neuron is a single unit of knowledge - a note, a bookmark, a source, or an idea - that lives in your graph.",
  },
  {
    q: "What is the difference between 2D and 3D graph?",
    slug: "2d-vs-3d-graph",
    a: "Genesis includes a 2D knowledge graph. Singularity unlocks the full 3D graph.",
  },
  {
    q: "How do I sign in?",
    slug: "how-do-i-sign-in",
    a: "You can sign in with Google, GitHub, or Magic Link (email).",
  },
  {
    q: "What is the Neural Core?",
    slug: "what-is-neural-core",
    a: "The Neural Core is Nervia's AI layer that uses RAG over your graph.",
  },
];

export function FAQ() {
  return (
    <div className="relative w-full">
      <div className="mx-auto max-w-3xl">
        <FadeIn className="text-center">
          <SectionHeader kicker="Sys.Req // faq" title="Frequently asked questions" />
        </FadeIn>
        <ul className="mt-16 space-y-6">
          {faqs.map((faq, i) => (
            <motion.li
              key={faq.q}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 * i, ease: "easeOut" }}
            >
              <Link
                href={`/faq#${faq.slug}`}
                className="block transition hover:border-indigo-500/25"
              >
                <HolographicCard className="group cursor-pointer transition hover:border-indigo-500/25">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-indigo-200">
                        {faq.q}
                      </h3>
                      <p className="mt-2 text-sm text-neutral-400 line-clamp-2">{faq.a}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-neutral-500 transition group-hover:translate-x-0.5 group-hover:text-indigo-300" />
                  </div>
                </HolographicCard>
              </Link>
            </motion.li>
          ))}
        </ul>
        <FadeIn delay={0.5} className="mt-8 flex justify-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-neutral-200 backdrop-blur-sm transition hover:bg-white/[0.06] hover:border-indigo-500/25 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-2 focus:ring-offset-black"
          >
            View all questions
            <ArrowRight className="h-4 w-4" />
          </Link>
        </FadeIn>
      </div>
    </div>
  );
}
