"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { History, Sparkles, Users, Brain, Share2, Loader2 } from "lucide-react";
import CloseButton from "./ui/CloseButton";

type HistoryEventKind = "big_bang" | "expansion" | "first_intelligence" | "shared_wisdom";

type HistoryEvent = {
  id: string;
  kind: HistoryEventKind;
  title: string;
  description: string;
  timestamp: number;
};

type GroupLike = { id?: string; name?: string; created_at?: string };
type NodeLike = { id?: string; title?: string; content?: string; created_at?: string; createdAt?: string; is_ai_processed?: boolean };

export interface UniverseHistoryProps {
  nodes: NodeLike[];
  groups: GroupLike[];
  supabase: any;
  onClose: () => void;
}

function parseTs(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const d = new Date(String(value));
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getNodeLabel(n: NodeLike): string {
  const t = (n.title ?? n.content ?? "").toString().trim();
  return t || (n.id ?? "Node");
}

function iconFor(kind: HistoryEventKind) {
  if (kind === "big_bang") return <Sparkles size={16} className="text-indigo-600 dark:text-purple-300" />;
  if (kind === "expansion") return <Users size={16} className="text-cyan-600 dark:text-cyan-300" />;
  if (kind === "first_intelligence") return <Brain size={16} className="text-amber-600 dark:text-amber-300" />;
  return <Share2 size={16} className="text-emerald-600 dark:text-emerald-300" />;
}

export default function UniverseHistory({ nodes, groups, supabase, onClose }: UniverseHistoryProps) {
  const [shareFirstTs, setShareFirstTs] = useState<number | null>(null);
  const [shareLoading, setShareLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadFirstShare = async () => {
      try {
        setShareLoading(true);
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id as string | undefined;
        if (!userId) {
          if (!cancelled) setShareFirstTs(null);
          return;
        }

        const { data, error } = await supabase
          .from("shares")
          .select("created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: true })
          .limit(1);

        if (error) {
          console.error("UniverseHistory: failed to fetch shares:", error);
          if (!cancelled) setShareFirstTs(null);
          return;
        }

        const first = Array.isArray(data) ? data[0] : null;
        const ts = parseTs(first?.created_at);
        if (!cancelled) setShareFirstTs(ts);
      } finally {
        if (!cancelled) setShareLoading(false);
      }
    };

    loadFirstShare();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const events = useMemo<HistoryEvent[]>(() => {
    const list: HistoryEvent[] = [];

    const nodeWithTs = (nodes || [])
      .map((n) => ({ n, ts: parseTs(n.created_at ?? n.createdAt) }))
      .filter((x): x is { n: NodeLike; ts: number } => x.ts != null);

    if (nodeWithTs.length > 0) {
      const firstNode = nodeWithTs.reduce((a, b) => (a.ts <= b.ts ? a : b));
      list.push({
        id: "big_bang",
        kind: "big_bang",
        title: "The Big Bang",
        description: `Your first neuron sparked into existence: “${getNodeLabel(firstNode.n)}”.`,
        timestamp: firstNode.ts,
      });
    }

    const aiNodes = nodeWithTs.filter(({ n }) => n.is_ai_processed === true);
    if (aiNodes.length > 0) {
      const firstAi = aiNodes.reduce((a, b) => (a.ts <= b.ts ? a : b));
      list.push({
        id: "first_intelligence",
        kind: "first_intelligence",
        title: "First Intelligence",
        description: `The universe gained pattern recognition — AI analyzed “${getNodeLabel(firstAi.n)}”.`,
        timestamp: firstAi.ts,
      });
    }

    const groupWithTs = (groups || [])
      .map((g, idx) => ({ g, ts: parseTs(g.created_at), idx }))
      .filter((x): x is { g: GroupLike; ts: number; idx: number } => x.ts != null);

    for (const { g, ts, idx } of groupWithTs) {
      const name = (g.name ?? "New group").toString().trim() || "New group";
      const id = (g.id ?? `group_${idx}`).toString();
      list.push({
        id: `expansion_${id}`,
        kind: "expansion",
        title: "Expansion",
        description: `A new constellation formed: “${name}”.`,
        timestamp: ts,
      });
    }

    if (shareFirstTs != null) {
      list.push({
        id: "shared_wisdom",
        kind: "shared_wisdom",
        title: "Shared Wisdom",
        description: "A public link opened — your Universe became shareable.",
        timestamp: shareFirstTs,
      });
    }

    return list
      .sort((a, b) => a.timestamp - b.timestamp)
      .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i);
  }, [nodes, groups, shareFirstTs]);

  const empty = events.length === 0 && !shareLoading;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-8 right-8 z-[80] w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white/90 dark:bg-neutral-900/80 backdrop-blur-2xl border border-indigo-500/30 dark:border-purple-500/30 shadow-[0_0_45px_rgba(168,85,247,0.12)] dark:shadow-[0_0_55px_rgba(6,182,212,0.12)] p-5"
        role="dialog"
        aria-label="Evolution Journal"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History size={20} className="text-indigo-600 dark:text-purple-300" />
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">Evolution Journal</span>
          </div>
          <CloseButton onClose={onClose} size={20} />
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          A cinematic record of how your Universe formed and evolved.
        </p>

        {shareLoading && events.length === 0 ? (
          <div className="py-8 flex items-center justify-center gap-3 text-neutral-500 dark:text-neutral-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-xs font-mono uppercase tracking-widest">Scanning history…</span>
          </div>
        ) : empty ? (
          <div className="py-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/20 dark:bg-purple-500/20 border border-indigo-500/30 dark:border-purple-500/30 flex items-center justify-center shadow-[0_0_28px_rgba(168,85,247,0.25)] mb-4">
              <Sparkles size={22} className="text-indigo-600 dark:text-purple-300" />
            </div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">No milestones yet</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Add a node, create a group, run Neural Sync, or share a link to begin.
            </p>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto pr-2 simple-scrollbar">
            <div className="relative">
              {/* glowing timeline spine */}
              <div className="absolute left-3 top-1 bottom-2 w-px bg-gradient-to-b from-indigo-500/0 via-indigo-500/30 to-indigo-500/0 dark:via-purple-400/30" />
              <div className="space-y-4">
                {events.map((e, idx) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.45, delay: Math.min(idx * 0.06, 0.5), ease: [0.16, 1, 0.3, 1] }}
                    className="relative pl-10"
                  >
                    {/* glowing point */}
                    <div className="absolute left-[7px] top-4">
                      <motion.div
                        className="w-3.5 h-3.5 rounded-full bg-indigo-400 dark:bg-purple-400 shadow-[0_0_16px_rgba(99,102,241,0.55)] dark:shadow-[0_0_18px_rgba(168,85,247,0.55)]"
                        animate={{
                          boxShadow: [
                            "0 0 14px rgba(99,102,241,0.40)",
                            "0 0 22px rgba(99,102,241,0.55)",
                            "0 0 14px rgba(99,102,241,0.40)",
                          ],
                        }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                        aria-hidden
                      />
                    </div>

                    {/* glass card */}
                    <div className="rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/10 p-4 shadow-[0_0_30px_rgba(0,0,0,0.08)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="shrink-0">{iconFor(e.kind)}</span>
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{e.title}</p>
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">{e.description}</p>
                        </div>
                        <span className="shrink-0 text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-500">
                          {formatDate(e.timestamp)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

