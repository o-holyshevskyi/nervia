"use client";

import { FadeIn } from "./FadeIn";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Explorer",
    subtitle: "Free",
    description: "Get started with your first neurons.",
    features: ["100 Neurons", "Basic UI", "Local storage"],
    cta: "Get started",
    highlighted: false,
  },
  {
    name: "Architect",
    subtitle: "Pro",
    description: "For serious builders and researchers.",
    features: [
      "Unlimited Neurons",
      "Neural Core (AI) access",
      "Custom Clusters",
      "Priority support",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Nexus",
    subtitle: "Team",
    description: "Shared workspaces and advanced telemetry.",
    features: [
      "Everything in Architect",
      "Shared workspaces",
      "Advanced telemetry",
      "SSO & admin controls",
    ],
    cta: "Contact sales",
    highlighted: false,
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
            Start free. Scale when you need to.
          </p>
        </FadeIn>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {tiers.map((tier, i) => (
            <FadeIn key={tier.name} delay={0.1 * (i + 1)}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-8 backdrop-blur-xl ${
                  tier.highlighted
                    ? "border-cyan-400/40 bg-cyan-500/5 shadow-[0_0_40px_rgba(6,182,212,0.15)]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <h3 className="text-xl font-semibold tracking-tight text-white">
                  {tier.name}
                </h3>
                <p className="mt-1 text-sm text-cyan-400">{tier.subtitle}</p>
                <p className="mt-4 text-slate-400">{tier.description}</p>
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
                <button
                  type="button"
                  className={`mt-8 w-full rounded-full py-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                    tier.highlighted
                      ? "bg-white text-slate-950 hover:bg-slate-100"
                      : "border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
