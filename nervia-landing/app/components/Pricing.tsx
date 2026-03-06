"use client";

import Link from "next/link";
import { FadeIn } from "./FadeIn";
import { SectionHeader } from "./SectionHeader";
import { Bookmark, Box, Brain, Clock, Download, Filter, InfinityIcon, LayoutGrid, MessageCircle, Route, Search, Share2, Sparkles } from "lucide-react";
import { APP_URL } from "../lib/app-url";
import { HolographicCard } from "./HolographicCard";

const tiers = [
  {
    name: "Genesis",
    price: "$0",
    period: "Forever",
    features: [
      { icon: Brain, text: 'Up to 60 Neurons' },
      { icon: LayoutGrid, text: '2D Knowledge Graph' },
      { icon: Bookmark, text: 'Browser Web Clipper' },
      { icon: Search, text: 'Standard Search' },
      { icon: Share2, text: 'Share 1 Cluster' },
    ],
    cta: "Start your Universe",
    ctaHref: `${APP_URL}/`,
    primary: false,
    highlighted: false,
  },
  {
    name: "Constellation",
    price: "$3,99",
    period: "month",
    features: [
      { icon: InfinityIcon, text: 'Unlimited Neurons' },
      { icon: Route, text: 'Pathfinder & Zen Mode' },
      { icon: Filter, text: 'Tags & Advanced Filters' },
      { icon: Download, text: 'Data Import/Export' },
      { icon: Share2, text: 'Up to 5 shares' },
      { icon: InfinityIcon, text: 'All Gnesis features' },
    ],
    cta: "Join Constellation",
    ctaHref: `${APP_URL}/settings/billing`,
    primary: false,
    highlighted: false,
  },
  {
    name: "Singularity",
    badge: "Ultimate AI Fusion",
    price: "$7,99",
    period: "month",
    features: [
      { icon: MessageCircle, text: 'Full AI Neural Core (Chat & Search)' },
      { icon: Sparkles, text: 'AI Semantic Search' },
      { icon: Box, text: '3D Graph Visualization' },
      { icon: Clock, text: 'Time Machine & Evolution Journal' },
      { icon: Share2, text: 'Unlimited shares' },
      { icon: InfinityIcon, text: 'All Constellation features' },
    ],
    cta: "Reach Singularity",
    ctaHref: `${APP_URL}/settings/billing`,
    primary: true,
    highlighted: true,
  },
];

export function Pricing() {
  return (
    <div className="relative w-full">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="text-center">
          <SectionHeader
            kicker="Sys.Req // plans"
            title="Simple pricing"
            subtitle="Start free. Upgrade when you need more."
          />
        </FadeIn>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {tiers.map((tier, i) => (
            <FadeIn key={tier.name} delay={0.1 * (i + 1)} className="min-w-0">
              <HolographicCard
                variant={tier.highlighted ? "highlighted" : "default"}
                className={`relative flex h-full flex-col p-8 ${
                  tier.highlighted
                    ? "border-indigo-400/40 shadow-[0_0_56px_rgba(99,102,241,0.18),0_0_32px_rgba(168,85,247,0.12)]"
                    : ""
                }`}
              >
                {tier.badge && (
                  <span className="inline-block rounded-full border border-indigo-400/40 bg-indigo-500/15 px-3 py-1 text-xs font-medium uppercase tracking-wider text-indigo-200">
                    {tier.badge}
                  </span>
                )}
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">
                  {tier.name}
                </h3>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {tier.price}
                  <span className="text-sm font-normal text-neutral-400"> / {tier.period}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((feature, index) => (
                    <li
                      key={feature.text + '-' + index}
                      className="flex items-center gap-3 text-sm text-neutral-300"
                    >
                      <feature.icon className="h-4 w-4 shrink-0 text-indigo-300" />
                      {feature.text}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-8 block w-full rounded-full py-3 text-center text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                    tier.primary
                      ? "bg-white text-slate-950 shadow-[0_0_24px_rgba(255,255,255,0.2)] hover:bg-slate-100 hover:shadow-[0_0_28px_rgba(255,255,255,0.25)]"
                      : "border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06] hover:border-indigo-500/25"
                  }`}
                >
                  {tier.cta}
                </Link>
              </HolographicCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </div>
  );
}
