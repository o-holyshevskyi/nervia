"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

type BadgeType = "New" | "Improved" | "Fixed";

interface ChangelogSection {
  tag: string;
  items: string[];
}

interface ChangelogItemProps {
  version: string;
  title: string;
  description?: string;
  sections?: ChangelogSection[];
  badges?: BadgeType[];
  isLast?: boolean;
  index?: number;
}

function ChangelogItem({ version, title, description, sections = [], badges = [], isLast = false, index = 0 }: ChangelogItemProps) {
  return (
    <motion.li
      className="relative flex gap-4 pb-8"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.08 }}
    >
      {!isLast && (
        <span
          className="absolute left-[7px] top-6 bottom-0 w-px bg-neutral-700 dark:bg-neutral-800"
          aria-hidden
        />
      )}
      <span
        className="relative z-10 mt-1.5 h-4 w-4 shrink-0 rounded-full border-2 border-indigo-500 dark:border-purple-500 bg-neutral-100 dark:bg-neutral-900"
        aria-hidden
      />
      <div className="flex-1 min-w-0 pt-0">
        <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-1">{version}</p>
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1.5">{title}</h3>
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {badges.map((badge) => (
              <span
                key={badge}
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                  badge === "New"
                    ? "bg-indigo-500/20 dark:bg-purple-500/20 text-indigo-600 dark:text-purple-400 border border-indigo-500/30 dark:border-purple-500/30"
                    : badge === "Improved"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                }`}
              >
                {badge}
              </span>
            ))}
          </div>
        )}
        {description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">{description}</p>
        )}
        {sections.length > 0 && (
          <div className="space-y-3">
            {sections.map(({ tag, items }) => (
              <div key={tag}>
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                  {tag}
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                  {items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.li>
  );
}

const CHANGELOG_ENTRIES: Omit<ChangelogItemProps, "isLast">[] = [
  {
    version: "v1.3.0 - 9 Mar 2026",
    title: "Obsidian & Notion import, Exocortex AI, and 3D polish",
    badges: ["New", "Improved", "Fixed"],
    sections: [
      {
        tag: "Import & data",
        items: [
          "Notion Workspace import (Singularity): upload a .ZIP export; notes are parsed, titles cleaned of Notion hashes, and [text](url) links become neural links. Notes skip AI processing; links are mapped in the data layer.",
          "Obsidian Vault import (Singularity): select one or more .md files; frontmatter (title, tags), wikilinks [[ ]], and inline #tags are extracted. Wikilinks are converted to neural connections; notes appear in the Obsidian cluster.",
          "Duplicate detection on import: bookmarks by URL, notes by title. Toasts when all items are duplicates or when some are skipped. AI processing runs only for HTML bookmarks; Obsidian/Notion imports finish without Neural Core.",
          "Data Management UI: HTML Bookmarks (all plans), Notion Workspace and Obsidian Vault (Singularity); locked state with upgrade CTA for non-Singularity. Confirm modal copy varies by source.",
        ],
      },
      {
        tag: "AI (Exocortex)",
        items: [
          "Neural Core rebranded to Exocortex in the AI chat system prompt: neuron-focused analysis, no generic pleasantries, clean Markdown, up to 5000 chars of content per neuron in context.",
          "Sidebar “Analyze” prompt restructured: Core Insight, Hidden Patterns, Suggested Action/Exploration, Suggested Tags (3–5). AI response cleared when switching neurons.",
        ],
      },
      {
        tag: "3D graph (Exocortex)",
        items: [
          "Group description labels: card-style texture with rounded background, cluster-colored accent bar, and theme-aware fill (dark/light). Descriptions no longer plain flat color.",
          "Cluster names: merged groupNames (Obsidian/Notion defaults) with groupNamesById so 3D cluster labels show correct names.",
          "Performance: shared sphere/torus geometry cache (one mesh per size), cluster group Map for O(1) orbital lookup, label texture caching to avoid GPU re-upload on every engine stop, nodeById Map in link strength callback.",
          "OrbitControls fix: re-enabled after node drag so camera controls are not left disabled by the per-frame refresh cycle.",
          "Link tooltip and mouse position use refs to avoid re-renders on every mousemove.",
        ],
      },
      {
        tag: "2D graph",
        items: [
          "Theme cache (getCachedTheme + MutationObserver on document class) so node/link drawing and group areas avoid getComputedStyle on every frame. Accent colors (purple/indigo) respect light/dark theme.",
          "Orbit animation: cluster-level repulsion O(clusters²) instead of per-node O(nodes²). nodeById map for O(1) link visibility and drawing.",
          "New group colors and names for Obsidian (6) and Notion (7); groupNames exported for 3D. drawGroupAreas now receives theme colors directly.",
        ],
      },
      {
        tag: "Sidebar & billing",
        items: [
          "Focus mode toggle: smooth fade/blur transition (150ms out, 200ms layout, fade in) so content and AI footer animate together; focus column width 500px, content min-height 80vh.",
          "Title textarea auto-height with ResizeObserver. Export label: “Export Universe (JSON)”.",
          "Billing: Singularity feature list includes “Obsidian/Notion Import”; feature arrays exported for reuse in UpgradeModal (single source of truth).",
        ],
      },
    ],
  },
  {
    version: "v1.2.2 - 6 Mar 2026",
    title: "Physics panel: node & cluster speed",
    badges: ["Improved", "Fixed"],
    sections: [
      {
        tag: "Physics of the Universe",
        items: [
          "Node speed and Cluster speed sliders in the Physics panel for tuning the 2D ambient orbit animation (nodes around cluster centers, clusters around global center).",
          "Changes apply in real time via physicsConfig; sliders available in both controlled and uncontrolled panel variants.",
        ],
      },
      {
        tag: "Technical",
        items: [
          "physicsConfig type extended with nodeSpeed and clusterSpeed across GraphNetwork, PhysicsControl, DemoUniverse, ShareViewClient, and main page so TypeScript and runtime stay in sync.",
        ],
      },
    ],
  },
  {
    version: "v1.2.1 - 6 Mar 2026",
    title: "Exocortex loading & ambient orbits",
    badges: ["Improved", "New"],
    sections: [
      {
        tag: "Exocortex (3D graph)",
        items: [
          "Cinematic loading sequence: “Connecting to Exocortex” → “Calculating Gravity” → “Mapping Neural Paths” → “Stabilizing Universe” → “Ready” / “Connection Stable” / “Synchronized” with spinner and overlay.",
          "Ambient orbit animation in 2D: nodes orbit around their cluster center; clusters orbit around the global center, with golden-ratio speed variation.",
          "Cluster force positioning (forceX/forceY) so nodes settle around cluster centers; initial zoom-to-fit and loading overlay dismissal when the engine is ready, with fallback timeout.",
          "D3 simulation alpha minimum (d3AlphaMin) configurable on the 2D graph for smoother settling.",
        ],
      },
      {
        tag: "UI",
        items: [
          "Refined loading screen typography for “Initializing Universe…” (smaller, letter-spaced, bold).",
          "Visibility change handling: loading overlay dismisses when returning to the tab if the engine has already finished.",
        ],
      },
    ],
  },
  {
    version: "v1.2.0 - 5 Mar 2026",
    title: "Nervia Landing",
    badges: ["New"],
    sections: [
      {
        tag: "Docs & discovery",
        items: [
          "Flight Plan (Roadmap) page with Now / Next / Later columns and sidebar link (4 Mar 2026).",
        ],
      },
    ],
  },
  {
    version: "v1.1.0 - 4 Mar 2026",
    title: "Identity, profile & feedback",
    badges: ["New", "Improved"],
    sections: [
      {
        tag: "Profile",
        items: [
          "Profile block is now a dropdown: Mission Feedback, Houston Support, What's New, Account Settings, Sign Out, Delete Account.",
          "Account Settings modal: update display name and upload a custom avatar (Supabase Storage).",
          "Premium rotating gradient border around the profile block (light and dark theme).",
        ],
      },
      {
        tag: "Feedback & support",
        items: [
          "Mission Feedback modal: send bugs or ideas to Houston via Resend (reply-to your email).",
          "Houston Support link to nervia.space/support in a new tab.",
        ],
      },
      {
        tag: "Account",
        items: [
          "Delete Account flow with confirmation and Supabase Admin; sign out and redirect after deletion.",
          "New users receive a welcome email via Resend on signup.",
        ],
      },
      {
        tag: "Docs & discovery",
        items: [
          "Transmission Logs (Changelog) page and What's New link in the profile dropdown.",
          "Swagger API documentation for developers.",
          "Native Documentation / Astronaut Manual page: sticky ToC, Introduction, Exocortex (3D graph), Web Clipper, Tags & Organization. Linked in sidebar."
        ],
      },
      {
        tag: "Analytics",
        items: [
          "Vercel Web Analytics added to root layout for usage insights.",
        ],
      },
    ],
  },
  {
    version: "v1.0.0 - Liftoff",
    title: "Welcome to Nervia",
    description:
      "Nervia is live. Welcome to your spatial knowledge graph—build your exocortex, visualize thoughts and links, and grow your universe.",
    badges: ["New"],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Universe
        </Link>

        <header className="mb-12">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
            Transmission Logs
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            The latest updates and improvements to the Nervia universe.
          </p>
        </header>

        <ul className="border-l-2 border-neutral-300 dark:border-neutral-800 pl-6">
          {CHANGELOG_ENTRIES.map((entry, i) => (
            <ChangelogItem
              key={`${entry.version}-${entry.title}`}
              {...entry}
              isLast={i === CHANGELOG_ENTRIES.length - 1}
              index={i}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
