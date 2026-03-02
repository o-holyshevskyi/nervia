"use client";

import Link from "next/link";
import { FadeIn } from "./FadeIn";
import { Check } from "lucide-react";
import { APP_URL } from "../lib/app-url";

const tiers = [
  {
    name: "Genesis",
    price: "$0",
    period: "Forever",
    features: [
      "Up to 60 Neurons",
      "2D Knowledge Graph",
      "Browser Web Clipper",
      "Standard Search",
      "Share 1 Cluster",
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
      "Unlimited Neurons",
      "Pathfinder & Zen Mode",
      "Tags & Advanced Filters",
      "Data Import/Export",
      "Up to 5 shares",
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
      "Full AI Neural Core (Chat & Search)",
      "AI Semantic Search",
      "3D Graph Visualization",
      "Time Machine & Evolution Journal",
      "Unlimited shares",
    ],
    cta: "Reach Singularity",
    ctaHref: `${APP_URL}/settings/billing`,
    primary: true,
    highlighted: true,
  },
];

export function Pricing() {
  return (
    <section className="relative px-6 py-24 md:py-32" id="pricing">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Simple pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Start free. Upgrade when you need more.
          </p>
        </FadeIn>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {tiers.map((tier, i) => (
            <FadeIn key={tier.name} delay={0.1 * (i + 1)} className="min-w-0">
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-8 backdrop-blur-xl ${
                  tier.highlighted
                    ? "border-cyan-400/50 border-purple-400/30 bg-cyan-500/5 shadow-[0_0_48px_rgba(6,182,212,0.2),0_0_32px_rgba(168,85,247,0.15)]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {tier.badge && (
                  <span className="inline-block rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-cyan-300">
                    {tier.badge}
                  </span>
                )}
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">
                  {tier.name}
                </h3>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {tier.price}
                  <span className="text-sm font-normal text-slate-400"> / {tier.period}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-sm text-slate-300"
                    >
                      <Check className="h-4 w-4 shrink-0 text-cyan-400" />
                      {feature}
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
                      : "border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06] hover:border-white/20"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
