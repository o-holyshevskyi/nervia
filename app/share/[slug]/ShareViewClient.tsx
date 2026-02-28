"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PanelLeftOpen, Sparkles } from "lucide-react";
import GraphNetwork from "@/src/components/GraphNetwork";
import FilterPanel from "@/src/components/FilterPanel";
import CloseButton from "@/src/components/ui/CloseButton";

const DEFAULT_PHYSICS = { repulsion: 150, linkDistance: 60 };
const VISIT_SPAM_WINDOW_MS = 60_000;
const VISIT_SPAM_MAX = 10;

function shouldSendVisitPing(slug: string): boolean {
  if (typeof window === "undefined" || !slug) return false;
  try {
    const key = `synapse_visit_${slug}`;
    const raw = sessionStorage.getItem(key);
    const now = Date.now();
    let data: { count: number; windowStart: number };
    if (raw) {
      try {
        data = JSON.parse(raw) as { count: number; windowStart: number };
        if (now - data.windowStart >= VISIT_SPAM_WINDOW_MS) {
          data = { count: 1, windowStart: now };
        } else {
          if (data.count >= VISIT_SPAM_MAX) return false;
          data.count += 1;
        }
      } catch {
        data = { count: 1, windowStart: now };
      }
    } else {
      data = { count: 1, windowStart: now };
    }
    sessionStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export default function ShareViewClient() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const [nodes, setNodes] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const tags = useMemo(() => {
    const set = new Set<string>();
    nodes.forEach((n: any) => {
      if (Array.isArray(n.tags)) n.tags.forEach((t: string) => set.add(t));
    });
    return Array.from(set).sort();
  }, [nodes]);

  useEffect(() => {
    if (!slug) {
      setError("Invalid share link");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/share/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        const contentType = res.headers.get("content-type") ?? "";
        if (!res.ok) {
          throw new Error(res.status === 404 ? "Share not found" : "Failed to load");
        }
        if (!contentType.includes("application/json")) {
          throw new Error("Failed to load shared content");
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setNodes(data.nodes || []);
          setLinks(data.links || []);
          setGroups(data.groups || []);
          if (shouldSendVisitPing(slug)) {
            fetch("/api/notifications/visit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug }),
            }).catch(() => {});
          }
        }
      })
      .catch((e) => {
        if (!cancelled) {
          const message =
            e instanceof SyntaxError
              ? "Failed to load shared content"
              : e.message || "Failed to load shared content";
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug]);

  const searchHighlightedIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return nodes
      .filter((n: any) => {
        const title = (n.title ?? n.content ?? "").toString().toLowerCase();
        const tagMatch = Array.isArray(n.tags) && n.tags.some((t: string) => String(t).toLowerCase().includes(q));
        return title.includes(q) || tagMatch;
      })
      .map((n: any) => (typeof n.id === "string" ? n.id : n.id?.id))
      .filter(Boolean);
  }, [nodes, searchQuery]);

  const effectiveHighlighted = searchQuery.trim() ? searchHighlightedIds : highlightedNodes;

  const graphData = useMemo(() => ({ nodes, links }), [nodes, links]);

  if (loading) {
    return (
      <main className="bg-white dark:bg-neutral-950 min-h-screen flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-indigo-500/30 dark:border-purple-500/30 border-t-indigo-600 dark:border-t-purple-400 rounded-full animate-spin" />
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">Loading shared universe…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="bg-white dark:bg-neutral-950 min-h-screen flex flex-col items-center justify-center p-6">
        <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-8 max-w-md text-center">
          <p className="text-neutral-700 dark:text-neutral-300 font-medium">{error}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-indigo-600 dark:text-purple-400 hover:underline"
          >
            Go to Nervia
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white dark:bg-neutral-950 flex min-h-screen flex-col relative">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="fixed top-0 left-0 h-full w-72 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-2xl border-r border-black/10 dark:border-white/10 shadow-xl z-40 flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                Shared view
              </span>
              <CloseButton onClose={() => setSidebarOpen(false)} size={18} />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by title or tag…"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-purple-500/50"
                  />
                </div>
              </div>
              <div>
                <span className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Tags
                </span>
                {tags.length === 0 ? (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 italic py-2">No tags</p>
                ) : (
                  <FilterPanel
                    tags={tags}
                    activeTag={activeTag}
                    onTagSelect={setActiveTag}
                    onClose={() => setSidebarOpen(false)}
                  />
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="hover:cursor-pointer fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <PanelLeftOpen size={20} />
          <span className="text-sm font-medium">Filters</span>
        </button>
      )}

      <div className="flex-1 w-full h-screen">
        <GraphNetwork
          graphData={graphData}
          activeTag={activeTag}
          focusedNodeId={null}
          zenModeNodeId={null}
          physicsConfig={DEFAULT_PHYSICS}
          highlightedNodes={effectiveHighlighted}
          groups={groups.map((g: any) => ({ id: g.id, name: g.name, color: g.color }))}
          onNodeSelect={() => {}}
          readOnly
          clusterMode="group"
        />
      </div>

      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto"
        aria-hidden
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-black/10 dark:border-white/10 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xs font-medium transition-colors"
        >
          <Sparkles size={12} className="text-indigo-500 dark:text-purple-400" />
          Intelligence Shared via Nervia
        </Link>
      </div>
    </main>
  );
}
