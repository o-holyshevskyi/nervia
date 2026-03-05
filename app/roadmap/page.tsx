import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Flight Plan | Nervia",
  description: "The future trajectory of the Nervia universe.",
};

type BadgeCategory = "Integration" | "AI" | "Core";

interface RoadmapCardProps {
  title: string;
  description: string;
  badge?: BadgeCategory;
}

function RoadmapCard({ title, description, badge }: RoadmapCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white/80 dark:border-neutral-700/50 dark:bg-neutral-900/60 backdrop-blur p-4 h-full flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">{title}</h3>
        {badge && (
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-200 text-neutral-600 dark:bg-neutral-700/80 dark:text-neutral-300">
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed flex-1">{description}</p>
    </div>
  );
}

const ROADMAP = {
  now: [
    {
      title: "Chrome Extension Global Rollout",
      description: "Waiting for store approval. The Web Clipper will be available to install from the Chrome Web Store.",
      badge: "Integration" as BadgeCategory,
    },
    {
      title: "Mobile Optimization",
      description: "Improving 3D graph performance on touch screens and responsive layouts for smaller devices.",
      badge: "Core" as BadgeCategory,
    },
  ],
  next: [
    {
      title: "Obsidian & Markdown Import",
      description: "Bring your existing second brain into the exocortex. Import notes and links from Obsidian and Markdown files.",
      badge: "Integration" as BadgeCategory,
    },
    {
      title: "Public Cluster Sharing",
      description: "Let users share read-only 3D graphs. Share a cluster as a public view-only universe.",
      badge: "Core" as BadgeCategory,
    },
  ],
  later: [
    {
      title: "Advanced AI Agents",
      description: "Automated tagging and connection discovery. AI that suggests links and tags across your universe.",
      badge: "AI" as BadgeCategory,
    },
    {
      title: "Local-first Mode",
      description: "Offline support. Work on your graph without a connection and sync when you're back online.",
      badge: "Core" as BadgeCategory,
    },
  ],
} as const;

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Universe
        </Link>

        <header className="mb-12">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
            Flight Plan
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            The future trajectory of the Nervia universe.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Now */}
          <div className="rounded-2xl border border-emerald-500/40 dark:border-emerald-500/30 bg-white/80 dark:bg-neutral-900/40 backdrop-blur p-5 shadow-[0_0_24px_rgba(16,185,129,0.12)] dark:shadow-[0_0_24px_rgba(16,185,129,0.08)]">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400/90 mb-4">
              Now
            </h2>
            <p className="text-[11px] text-neutral-500 mb-4">What we are currently working on</p>
            <div className="space-y-3">
              {ROADMAP.now.map((item) => (
                <RoadmapCard
                  key={item.title}
                  title={item.title}
                  description={item.description}
                  badge={item.badge}
                />
              ))}
            </div>
          </div>

          {/* Next */}
          <div className="rounded-2xl border border-indigo-500/30 dark:border-purple-500/25 bg-white/80 dark:bg-neutral-900/40 backdrop-blur p-5 shadow-[0_0_24px_rgba(99,102,241,0.1)] dark:shadow-[0_0_24px_rgba(168,85,247,0.06)]">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-purple-400/90 mb-4">
              Next
            </h2>
            <p className="text-[11px] text-neutral-500 mb-4">Coming soon</p>
            <div className="space-y-3">
              {ROADMAP.next.map((item) => (
                <RoadmapCard
                  key={item.title}
                  title={item.title}
                  description={item.description}
                  badge={item.badge}
                />
              ))}
            </div>
          </div>

          {/* Later */}
          <div className="rounded-2xl border border-neutral-300 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-900/40 backdrop-blur p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4">
              Later
            </h2>
            <p className="text-[11px] text-neutral-500 mb-4">Future vision</p>
            <div className="space-y-3">
              {ROADMAP.later.map((item) => (
                <RoadmapCard
                  key={item.title}
                  title={item.title}
                  description={item.description}
                  badge={item.badge}
                />
              ))}
            </div>
          </div>
        </div>

        <footer className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-sm text-neutral-500">
          <Link href="/" className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors">
            ← Back to Universe
          </Link>
        </footer>
      </div>
    </div>
  );
}
