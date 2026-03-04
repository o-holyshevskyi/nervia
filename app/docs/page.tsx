"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const TOC = [
  { id: "introduction", label: "Introduction" },
  { id: "exocortex", label: "The Exocortex & Graph" },
  { id: "sidebar", label: "Left Sidebar & Navigation" },
  { id: "search", label: "Search" },
  { id: "discovery", label: "Discovery Tools" },
  { id: "collections", label: "Collections (Clusters)" },
  { id: "view-options", label: "View Options" },
  { id: "telemetry", label: "System Telemetry" },
  { id: "management", label: "Management" },
  { id: "profile-account", label: "Profile & Account" },
  { id: "web-clipper", label: "Web Clipper" },
  { id: "tags-organization", label: "Tags & Organization" },
  { id: "plans", label: "Plans & Limits" },
];

function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
      <div className="space-y-4 text-neutral-300 leading-relaxed">{children}</div>
    </section>
  );
}

export default function DocsPage() {
  const handleTocClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
      <aside className="sticky top-0 h-screen w-56 shrink-0 border-r border-neutral-800 bg-neutral-900/50 backdrop-blur-xl overflow-y-auto">
        <div className="flex flex-col gap-4 p-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            Back to Universe
          </Link>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
            On this page
          </span>
          <nav className="flex flex-col gap-0.5">
            {TOC.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => handleTocClick(e, id)}
                className="block rounded-lg px-3 py-2 text-sm text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto scroll-smooth min-h-screen">
        <div className="max-w-3xl mx-auto px-8 py-16">
          <header className="mb-16">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              Astronaut Manual
            </h1>
            <p className="text-neutral-400 text-lg">
              Your guide to the Nervia universe—sidebar, discovery tools, collections, and more.
            </p>
          </header>

          <article className="space-y-16">
            <DocSection id="introduction" title="Introduction">
              <p>
                Nervia is a <strong className="text-neutral-200">spatial knowledge graph</strong>: your ideas, bookmarks, and notes live as nodes in a shared universe. You build an exocortex—a second brain you can see, navigate, and grow. Each thought is a node; shared tags and manual links create edges. The graph uses gravity and layout so related concepts cluster together, making patterns visible at a glance.
              </p>
            </DocSection>

            <DocSection id="exocortex" title="The Exocortex & Graph">
              <p>
                The main canvas is your <strong className="text-neutral-200">Exocortex</strong>. Every saved link, note, or idea is a node. Nodes that share tags are pulled together by gravity; the more tags in common, the stronger the pull. You can also link nodes manually. The graph updates in real time as you edit and connect.
              </p>
              <p className="text-neutral-400 text-sm font-medium mt-4">Graph controls:</p>
              <ul className="list-disc list-inside space-y-1 text-neutral-300">
                <li><strong className="text-neutral-200">Left-click</strong> a node to open its details in the right sidebar.</li>
                <li><strong className="text-neutral-200">Drag</strong> the canvas to pan; drag a node to reposition it.</li>
                <li><strong className="text-neutral-200">Scroll</strong> (or pinch) to zoom in and out.</li>
                <li>Right-click on the canvas or a node for context menus (e.g. add neuron, add link).</li>
              </ul>
            </DocSection>

            <DocSection id="sidebar" title="Left Sidebar & Navigation">
              <p>
                Open the <strong className="text-neutral-200">left sidebar</strong> from the dashboard button (top-left when closed). It contains the main navigation and sub-views. From top to bottom you have: <strong className="text-neutral-200">Search</strong>, <strong className="text-neutral-200">Discovery Tools</strong>, <strong className="text-neutral-200">Collections</strong>, <strong className="text-neutral-200">View Options</strong>, <strong className="text-neutral-200">System Telemetry</strong>, <strong className="text-neutral-200">Management</strong>, and at the bottom the <strong className="text-neutral-200">profile block</strong> (click to open the account dropdown). Tap any section to drill into it; use the back arrow to return to the main menu.
              </p>
            </DocSection>

            <DocSection id="search" title="Search">
              <p>
                <strong className="text-neutral-200">Search</strong> opens the command palette / neural search. Use it to find neurons by title, content, or tags. Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 text-xs font-mono">Ctrl+K</kbd>. On higher plans, AI-powered semantic search is available.
              </p>
            </DocSection>

            <DocSection id="discovery" title="Discovery Tools">
              <p>
                Under <strong className="text-neutral-200">Discovery Tools</strong> you get access to several features. Availability depends on your plan (see Plans & Limits).
              </p>
              <ul className="list-disc list-inside space-y-2 text-neutral-300">
                <li><strong className="text-neutral-200">Pathfinder</strong> — Find shortest paths between two nodes. Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 text-xs font-mono">Ctrl+Alt+P</kbd>. (Constellation and above.)</li>
                <li><strong className="text-neutral-200">Zen Mode</strong> — Focus on a single node; hide the sidebar and zoom to the selection. (Constellation and above.)</li>
                <li><strong className="text-neutral-200">Time Machine</strong> — Timeline view of your universe over time. Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 text-xs font-mono">Ctrl+Alt+T</kbd>. (Singularity.)</li>
                <li><strong className="text-neutral-200">Evolution Journal</strong> — History of changes. Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 text-xs font-mono">Ctrl+Alt+H</kbd>. (Singularity.)</li>
                <li><strong className="text-neutral-200">Neural Core</strong> — AI chat and semantic search over your graph. Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 text-xs font-mono">Ctrl+Alt+C</kbd>. (Singularity.)</li>
              </ul>
              <p className="text-neutral-400 text-sm">
                Locked features show a lock icon and prompt you to upgrade when clicked.
              </p>
            </DocSection>

            <DocSection id="collections" title="Collections (Clusters)">
              <p>
                <strong className="text-neutral-200">Collections</strong> (called Clusters in the UI) are groups of neurons. Open the sidebar and select <strong className="text-neutral-200">Collections</strong> to see your clusters, create new ones (plus button), share a cluster (share icon), or delete one (trash). You can also use the quick <strong className="text-neutral-200">+</strong> on the Collections row to add a new neuron. Each cluster has a name and color; neurons can be assigned to a cluster when editing.
              </p>
              <p>
                <strong className="text-neutral-200">Filters</strong> appear in the same view: filter the graph by tag. Advanced tag filtering is available on Constellation and above; otherwise you can still see tags listed.
              </p>
            </DocSection>

            <DocSection id="view-options" title="View Options">
              <p>
                In <strong className="text-neutral-200">View Options</strong> you can change how the universe looks and behaves:
              </p>
              <ul className="list-disc list-inside space-y-1 text-neutral-300">
                <li><strong className="text-neutral-200">Theme</strong> — Toggle light / dark mode.</li>
                <li><strong className="text-neutral-200">Gravity Shift</strong> — Choose whether nodes cluster by <strong className="text-neutral-200">Cluster</strong> (collection) or by <strong className="text-neutral-200">Tag</strong>. This changes how gravity groups nodes on the graph.</li>
                <li><strong className="text-neutral-200">Universe view</strong> — Switch between <strong className="text-neutral-200">2D</strong> and <strong className="text-neutral-200">3D</strong>. 3D is available on Singularity; other plans see a lock and an upgrade prompt.</li>
              </ul>
            </DocSection>

            <DocSection id="telemetry" title="System Telemetry">
              <p>
                <strong className="text-neutral-200">System Telemetry</strong> shows the health and status of your universe:
              </p>
              <ul className="list-disc list-inside space-y-1 text-neutral-300">
                <li><strong className="text-neutral-200">Companion (Web Clipper)</strong> — Whether the Chrome extension is detected (SYNC: ONLINE) or not (CLIPPER: OFFLINE). A link to install the extension is shown when offline.</li>
                <li><strong className="text-neutral-200">Universe capacity</strong> — Neuron count and limit (e.g. 45 / 60 on Genesis), with a progress bar. On Constellation/Singularity, status shows as Unlimited.</li>
                <li><strong className="text-neutral-200">Links</strong> — Total link count.</li>
                <li><strong className="text-neutral-200">Shares</strong> — How many shared universes/clusters you have vs your plan limit.</li>
                <li><strong className="text-neutral-200">Focus</strong> — The currently active tag filter (if any), e.g. <code className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 text-sm">#research</code>.</li>
              </ul>
            </DocSection>

            <DocSection id="management" title="Management">
              <p>
                The <strong className="text-neutral-200">Management</strong> view groups account and data actions:
              </p>
              <ul className="list-disc list-inside space-y-1 text-neutral-300">
                <li><strong className="text-neutral-200">Notifications</strong> — Open the notification panel. Unread count is shown when there are new notifications (e.g. activity in your universe).</li>
                <li><strong className="text-neutral-200">Share</strong> — Open the share modal to create a public link to your full universe or selected clusters. Share count is limited by plan (Genesis: 1, Constellation: 5, Singularity: unlimited).</li>
                <li><strong className="text-neutral-200">Data Transfer</strong> — Import and export your graph (Constellation and above). Export downloads your neurons and links; import restores from a backup.</li>
                <li><strong className="text-neutral-200">Billing</strong> — Open the billing/settings page to manage your subscription and plan.</li>
              </ul>
            </DocSection>

            <DocSection id="profile-account" title="Profile & Account">
              <p>
                At the bottom of the sidebar, the <strong className="text-neutral-200">profile block</strong> shows your avatar, name, and email. Click it to open a dropdown menu:
              </p>
              <ul className="list-disc list-inside space-y-1 text-neutral-300">
                <li><strong className="text-neutral-200">Mission Feedback</strong> — Open a modal to send feedback or bug reports to the team (emails to Houston with your address as reply-to).</li>
                <li><strong className="text-neutral-200">Houston Support</strong> — Open the support page (nervia.space/support) in a new tab.</li>
                <li><strong className="text-neutral-200">What&apos;s New</strong> — Open the Changelog (Transmission Logs) page.</li>
                <li><strong className="text-neutral-200">Documentation</strong> — Open this Astronaut Manual.</li>
                <li><strong className="text-neutral-200">Account Settings</strong> — Update your display name and upload a custom avatar (stored in Supabase).</li>
                <li><strong className="text-neutral-200">Sign Out</strong> — Sign out of your account.</li>
                <li><strong className="text-neutral-200">Delete Account</strong> — Permanently delete your account and data (confirmation required).</li>
              </ul>
            </DocSection>

            <DocSection id="web-clipper" title="Web Clipper">
              <p>
                The Nervia <strong className="text-neutral-200">Chrome Extension</strong> (Web Clipper / Companion) captures the web into your universe. Install it from the extension store or the Nervia dashboard; when installed, System Telemetry shows &quot;SYNC: ONLINE.&quot;
              </p>
              <p>
                From any page you can save the current <strong className="text-neutral-200">URL</strong>, add a <strong className="text-neutral-200">title</strong> and <strong className="text-neutral-200">notes</strong>, and apply <strong className="text-neutral-200">tags</strong> so the new neuron links to existing ones. Highlights and selected text can be captured as notes. Saved items sync to your graph so you can open and connect them later.
              </p>
            </DocSection>

            <DocSection id="tags-organization" title="Tags & Organization">
              <p>
                <strong className="text-neutral-200">Tags</strong> are the main way to organize and connect neurons. Use a consistent style (e.g. <code className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 text-sm">#product</code>, <code className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 text-sm">#research</code>) so the graph can cluster related nodes. Combine tags with <strong className="text-neutral-200">Collections</strong>: tag as you capture, then assign neurons to clusters for focus. The result is an interconnected universe that stays readable as it grows.
              </p>
            </DocSection>

            <DocSection id="plans" title="Plans & Limits">
              <p>
                Nervia offers three plans that control neuron limits, shares, and feature access:
              </p>
              <ul className="list-disc list-inside space-y-2 text-neutral-300">
                <li><strong className="text-neutral-200">Genesis</strong> — Up to 60 neurons, 1 shared universe/cluster. 2D graph, basic search, and core sidebar features. Pathfinder, Zen Mode, advanced filters, and Data Transfer are locked.</li>
                <li><strong className="text-neutral-200">Constellation</strong> — Unlimited neurons, up to 5 shares. Adds Pathfinder, Zen Mode, advanced tag filters, and Import/Export (Data Transfer).</li>
                <li><strong className="text-neutral-200">Singularity</strong> — Unlimited neurons and unlimited shares. Adds 3D graph, Time Machine, Evolution Journal, Neural Core (AI chat & semantic search), and full AI features.</li>
              </ul>
              <p className="text-neutral-400 text-sm">
                Your current capacity and share count are visible in System Telemetry. Locked features show a lock icon and an upgrade prompt when clicked.
              </p>
            </DocSection>
          </article>

          <footer className="mt-20 pt-8 border-t border-neutral-800 text-sm text-neutral-500">
            <Link href="/" className="text-neutral-400 hover:text-white transition-colors">
              ← Back to Universe
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
}
