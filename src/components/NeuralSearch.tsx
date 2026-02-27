/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Command, FileText, Lightbulb, LinkIcon } from "lucide-react";
import CloseButton from "./ui/CloseButton";

export interface NeuralSearchResult {
  id: string;
  relevance: number;
  reason: string;
}

interface NeuralSearchProps {
  nodes: any[];
  onResultSelect: (node: any) => void;
  onSearchChange: (highlightedIds: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenRef?: React.MutableRefObject<(() => void) | null>;
}

function getNodeIcon(type: string) {
  if (type === "link") return <LinkIcon size={14} className="text-blue-500 dark:text-blue-400" />;
  if (type === "note") return <FileText size={14} className="text-green-600 dark:text-green-400" />;
  if (type === "idea") return <Lightbulb size={14} className="text-indigo-600 dark:text-purple-400" />;
  return <FileText size={14} className="text-neutral-500 dark:text-neutral-400" />;
}

export default function NeuralSearch({
  nodes,
  onResultSelect,
  onSearchChange,
  isOpen,
  onClose,
  onOpenRef,
}: NeuralSearchProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [semanticResults, setSemanticResults] = useState<NeuralSearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const showSemanticResults = semanticResults.length > 0;
  const textFilteredNodes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return nodes.filter((node: any) => {
      const idStr = (typeof node.id === "string" ? node.id : node.id?.id ?? "").toLowerCase();
      const tagMatch =
        Array.isArray(node.tags) &&
        node.tags.some((t: string) => String(t).toLowerCase().includes(q));
      return idStr.includes(q) || tagMatch;
    });
  }, [nodes, query]);

  const focusAndClear = useCallback(() => {
    setQuery("");
    setSemanticResults([]);
    onSearchChange([]);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [onSearchChange]);

  useEffect(() => {
    if (onOpenRef) onOpenRef.current = focusAndClear;
    return () => {
      if (onOpenRef) onOpenRef.current = null;
    };
  }, [onOpenRef, focusAndClear]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const runSemanticSearch = async () => {
    const q = query.trim();
    if (!q || nodes.length === 0) return;
    setIsLoading(true);
    setSemanticResults([]);
    try {
      const contextNodes = nodes.map((n: any) => ({
        id: typeof n.id === "string" ? n.id : n.id?.id ?? "",
        summary: (n.content || (typeof n.id === "string" ? n.id : n.id?.id ?? "")) as string,
        tags: Array.isArray(n.tags) ? n.tags : [],
      }));
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, contextNodes }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Search failed: ${res.status}`);
      }
      const data = await res.json();
      const list = Array.isArray(data.results) ? data.results : [];
      setSemanticResults(list);
      onSearchChange(list.map((r: NeuralSearchResult) => r.id));
    } catch (err) {
      console.error("Neural search error:", err);
      setSemanticResults([]);
      onSearchChange([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") runSemanticSearch();
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (showSemanticResults) {
      setSemanticResults([]);
      onSearchChange([]);
    }
  };

  const handleClose = () => {
    onSearchChange([]);
    onClose();
  };

  const handleSelect = (node: any) => {
    onResultSelect(node);
  };

  const nodeById = useMemo(
    () =>
      new Map(
        nodes.map((n: any) => {
          const id = typeof n.id === "string" ? n.id : n.id?.id;
          return [id, n];
        })
      ),
    [nodes]
  );

  const isEmpty = !query.trim() && !showSemanticResults && textFilteredNodes.length === 0;
  const showTextResults = query.trim() && !showSemanticResults;
  const showSemanticList = !isLoading && showSemanticResults;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[90] bg-black/20 dark:bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden
          />
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4 pt-6"
          >
            <div className="bg-white/95 dark:bg-neutral-900/80 backdrop-blur-2xl border border-black/10 dark:border-purple-500/30 rounded-2xl shadow-xl dark:shadow-[0_0_40px_rgba(168,85,247,0.2)] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-black/10 dark:border-white/10">
                {isLoading ? (
                  <Sparkles size={20} className="text-indigo-600 dark:text-purple-400 animate-pulse shrink-0" />
                ) : (
                  <Search size={20} className="text-neutral-500 dark:text-neutral-400 shrink-0" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search by name or meaning… (Enter for semantic search)"
                  className="flex-1 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none text-base"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={runSemanticSearch}
                  disabled={isLoading || !query.trim() || nodes.length === 0}
                  className="hover:cursor-pointer px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 dark:bg-purple-600 dark:hover:bg-purple-500 disabled:opacity-50 disabled:hover:cursor-not-allowed text-white text-sm font-medium shrink-0"
                >
                  Search
                </button>
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                  <Command size={10} /> Ctrl+K
                </span>
                <CloseButton onClose={handleClose} size={18} />
              </div>

              <div className="max-h-[50vh] overflow-y-auto simple-scrollbar p-2">
                {isLoading && (
                  <div className="py-8 flex items-center justify-center gap-2 text-neutral-500 dark:text-neutral-400 text-sm">
                    <Sparkles size={16} className="animate-pulse" />
                    <span>Analyzing semantic patterns…</span>
                  </div>
                )}
                {!isLoading && isEmpty && (
                  <p className="py-6 text-center text-neutral-500 dark:text-neutral-400 text-sm">
                    Type to filter by name or tags. Press Enter for semantic search by meaning.
                  </p>
                )}
                {!isLoading && showTextResults && textFilteredNodes.length === 0 && (
                  <p className="py-6 text-center text-neutral-500 dark:text-neutral-400 text-sm">
                    Nothing found for &quot;{query.trim()}&quot;. Try Enter for semantic search.
                  </p>
                )}
                {!isLoading && showTextResults && textFilteredNodes.length > 0 && (
                  <>
                    <p className="px-2 py-1 text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      By text
                    </p>
                    {textFilteredNodes.map((node: any) => {
                      const idStr = typeof node.id === "string" ? node.id : node.id?.id;
                      const label = node.title ?? node.content ?? idStr;
                      return (
                        <button
                          key={idStr}
                          type="button"
                          onClick={() => handleSelect(node)}
                          className="hover:cursor-pointer w-full flex items-center justify-between px-4 py-3 text-left rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors">
                              {getNodeIcon(node.type)}
                            </div>
                            <div>
                              <p className="text-neutral-900 dark:text-white text-sm font-medium">{label}</p>
                              {node.tags && node.tags.length > 0 && (
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">#{node.tags[0]}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-neutral-600 dark:text-neutral-500 group-hover:text-indigo-600 dark:group-hover:text-purple-400 transition-colors">
                            Go →
                          </span>
                        </button>
                      );
                    })}
                  </>
                )}
                {showSemanticList && (
                  <>
                    <p className="px-2 py-1 text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      By meaning
                    </p>
                    {semanticResults.map((r) => {
                    const node = nodeById.get(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => node && handleSelect(node)}
                        className="hover:cursor-pointer w-full flex flex-col items-start px-4 py-3 text-left rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors shrink-0">
                              {node ? getNodeIcon(node.type) : <FileText size={14} className="text-neutral-500 dark:text-neutral-400" />}
                            </div>
                            <span className="text-neutral-900 dark:text-white font-medium truncate">{node ? (node.title ?? node.content ?? r.id) : r.id}</span>
                          </div>
                          <span className="text-[10px] font-mono text-indigo-600 dark:text-purple-400 bg-indigo-500/10 dark:bg-purple-500/10 px-2 py-0.5 rounded border border-indigo-500/20 dark:border-purple-500/20 shrink-0">
                            {r.relevance}%
                          </span>
                        </div>
                        {r.reason && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 ml-11">{r.reason}</p>
                        )}
                      </button>
                    );
                    })}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
