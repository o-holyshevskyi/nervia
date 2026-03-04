import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Changelog | Nervia",
  description: "The latest updates and improvements to the Nervia universe.",
};

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
}

function ChangelogItem({ version, title, description, sections = [], badges = [], isLast = false }: ChangelogItemProps) {
  return (
    <li className="relative flex gap-4 pb-8">
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
    </li>
  );
}

const CHANGELOG_ENTRIES: Omit<ChangelogItemProps, "isLast">[] = [
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
          "Native Documentation / Astronaut Manual page: sticky ToC, Introduction, Exocortex (3D graph), Web Clipper, Tags & Organization. Linked in sidebar.",
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
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
