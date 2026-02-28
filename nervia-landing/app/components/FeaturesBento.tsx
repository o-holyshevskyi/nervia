"use client";

import { FadeIn } from "./FadeIn";
import {
  Box,
  MessageCircle,
  Search,
  Compass,
  Bookmark,
  History,
  Globe,
} from "lucide-react";

const cards = [
  {
    title: "3D Graph Visualization",
    description:
      "Fly through your knowledge in 3D. Connect neurons, sources, and impulses as a living network.",
    icon: Box,
    large: true,
  },
  {
    title: "Neural Core (AI Chat)",
    description:
      "Chat with your universe. RAG-powered AI finds hidden connections and answers in milliseconds.",
    icon: MessageCircle,
    large: true,
  },
  {
    title: "AI Semantic Search",
    description:
      "Find ideas by meaning, not just keywords. Search the way your brain associates concepts.",
    icon: Search,
    large: false,
  },
  {
    title: "Pathfinder & Zen Mode",
    description:
      "Focus and navigate your graph with clarity. Pathfinder and Zen Mode keep you in the flow.",
    icon: Compass,
    large: false,
  },
  {
    title: "Browser Web Clipper",
    description:
      "Save pages and ideas from the web straight into your graph. One click to add a new neuron.",
    icon: Bookmark,
    large: false,
  },
  {
    title: "Time Machine & Evolution Journal",
    description:
      "See how your knowledge evolved over time. Revisit past states and track the growth of your universe.",
    icon: History,
    large: false,
  },
  {
    title: "Shared Universes",
    description:
      "Publish clusters as interactive 3D worlds. Share your universe with others to explore.",
    icon: Globe,
    large: false,
    fullWidth: true,
  },
];

export function FeaturesBento() {
  return (
    <section className="relative px-6 py-24 md:py-32" id="features">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Built for how you think
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            One visual intelligence layer for your notes, research, and ideas.
          </p>
        </FadeIn>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => {
            const Icon = card.icon;
            const fullWidth = "fullWidth" in card && card.fullWidth;
            const spanClass = fullWidth
              ? "sm:col-span-2 lg:col-span-4"
              : card.large
                ? "sm:col-span-2"
                : "";
            return (
              <FadeIn
                key={card.title}
                delay={0.05 * (i + 1)}
                className={spanClass}
              >
                <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.05] md:p-8">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                    <Icon className="h-5 w-5 text-cyan-400" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight text-white md:text-xl">
                    {card.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-slate-400 md:text-base">
                    {card.description}
                  </p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
