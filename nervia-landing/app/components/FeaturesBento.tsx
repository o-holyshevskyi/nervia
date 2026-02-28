"use client";

import { FadeIn } from "./FadeIn";
import {
  Box,
  MessageCircle,
  GitBranch,
  Globe,
} from "lucide-react";

const cards = [
  {
    title: "Interactive 3D Graph",
    description:
      "Fly through your knowledge. Connect Neurons, Sources, and Impulses visually.",
    icon: Box,
    large: true,
  },
  {
    title: "Neural Core (AI)",
    description:
      "Chat with your universe. Our RAG-powered AI finds hidden connections in milliseconds.",
    icon: MessageCircle,
    large: false,
  },
  {
    title: "Auto-Clusters",
    description:
      "Watch as related ideas automatically pull together into smart clusters.",
    icon: GitBranch,
    large: false,
  },
  {
    title: "Shared Intelligence",
    description:
      "Publish your clusters as interactive 3D worlds for others to explore.",
    icon: Globe,
    large: false,
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
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <FadeIn
                key={card.title}
                delay={0.1 * (i + 1)}
                className={card.large ? "md:col-span-2" : ""}
              >
                <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.05]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                    <Icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight text-white">
                    {card.title}
                  </h3>
                  <p className="mt-3 flex-1 text-slate-400">{card.description}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
