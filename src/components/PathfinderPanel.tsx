/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Route, X, Search } from "lucide-react";
import { findShortestPath } from "@/src/utils/graphAlgorithms";
import CloseButton from "./ui/CloseButton";

function getNodeId(node: any): string {
  return typeof node.id === "string" ? node.id : node?.id ?? "";
}

interface PathfinderPanelProps {
  nodes: any[];
  links: any[];
  onPathFound: (pathNodes: string[], pathLinks: any[]) => void;
  onClose: () => void;
}

export default function PathfinderPanel({
  nodes,
  links,
  onPathFound,
  onClose,
}: PathfinderPanelProps) {
  const [startQuery, setStartQuery] = useState("");
  const [targetQuery, setTargetQuery] = useState("");
  const [startId, setStartId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [noPathMessage, setNoPathMessage] = useState(false);
  const startRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  const filteredStartNodes = useMemo(() => {
    const q = startQuery.trim().toLowerCase();
    if (!q) return nodes.slice(0, 15);
    return nodes.filter((node: any) => {
      const id = getNodeId(node);
      const tagMatch =
        Array.isArray(node.tags) &&
        node.tags.some((t: string) => String(t).toLowerCase().includes(q));
      return id.toLowerCase().includes(q) || tagMatch;
    }).slice(0, 15);
  }, [nodes, startQuery]);

  const filteredTargetNodes = useMemo(() => {
    const q = targetQuery.trim().toLowerCase();
    if (!q) return nodes.slice(0, 15);
    return nodes.filter((node: any) => {
      const id = getNodeId(node);
      const tagMatch =
        Array.isArray(node.tags) &&
        node.tags.some((t: string) => String(t).toLowerCase().includes(q));
      return id.toLowerCase().includes(q) || tagMatch;
    }).slice(0, 15);
  }, [nodes, targetQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (startRef.current?.contains(target) || targetRef.current?.contains(target)) return;
      setStartOpen(false);
      setTargetOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFindConnection = () => {
    if (startId == null || targetId == null) return;
    setNoPathMessage(false);
    const { pathNodes, pathLinks } = findShortestPath(startId, targetId, nodes, links);
    if (pathNodes.length === 0 && startId !== targetId) {
      setNoPathMessage(true);
      onPathFound([], []);
    } else {
      onPathFound(pathNodes, pathLinks);
    }
  };

  const handleClearClose = () => {
    onPathFound([], []);
    onClose();
    setStartId(null);
    setTargetId(null);
    setStartQuery("");
    setTargetQuery("");
    setNoPathMessage(false);
  };

  const canFind = startId != null && targetId != null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-8 right-8 z-80 w-[360px] rounded-2xl bg-neutral-900/80 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.2)] p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Route size={20} className="text-cyan-400" />
            <span className="text-sm font-semibold text-white">Pathfinder</span>
          </div>
          <CloseButton onClose={handleClearClose} size={20} />
        </div>

        <p className="text-xs text-neutral-400 mb-4">
          Find the shortest connection between two nodes.
        </p>

        <div className="space-y-4">
          <div ref={startRef} className="relative">
            <label className="block text-xs font-medium text-cyan-400/90 mb-1.5">
              Start Node
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={startId != null ? startId : startQuery}
                onChange={(e) => {
                  setStartQuery(e.target.value);
                  setStartId(null);
                  setStartOpen(true);
                }}
                onFocus={() => setStartOpen(true)}
                placeholder="Search start node..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-cyan-500/20 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <AnimatePresence>
              {startOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl bg-neutral-800/95 border border-cyan-500/20 shadow-xl z-50"
                >
                  {filteredStartNodes.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-neutral-500 text-center">
                      No matches
                    </div>
                  ) : (
                    filteredStartNodes.map((node: any) => {
                      const id = getNodeId(node);
                      const selected = startId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setStartId(id);
                            setStartQuery(id);
                            setStartOpen(false);
                          }}
                          className={`hover:cursor-pointer w-full px-3 py-2.5 text-left text-sm transition-colors flex items-center gap-2 ${
                            selected
                              ? "bg-cyan-500/30 text-cyan-200"
                              : "text-neutral-300 hover:bg-white/10"
                          }`}
                        >
                          <span className="truncate">{id}</span>
                          {node.type && (
                            <span className="text-[10px] text-neutral-500 shrink-0">
                              {node.type}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div ref={targetRef} className="relative">
            <label className="block text-xs font-medium text-cyan-400/90 mb-1.5">
              Target Node
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={targetId != null ? targetId : targetQuery}
                onChange={(e) => {
                  setTargetQuery(e.target.value);
                  setTargetId(null);
                  setTargetOpen(true);
                }}
                onFocus={() => setTargetOpen(true)}
                placeholder="Search target node..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-cyan-500/20 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <AnimatePresence>
              {targetOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl bg-neutral-800/95 border border-cyan-500/20 shadow-xl z-50"
                >
                  {filteredTargetNodes.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-neutral-500 text-center">
                      No matches
                    </div>
                  ) : (
                    filteredTargetNodes.map((node: any) => {
                      const id = getNodeId(node);
                      const selected = targetId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setTargetId(id);
                            setTargetQuery(id);
                            setTargetOpen(false);
                          }}
                          className={`hover:cursor-pointer w-full px-3 py-2.5 text-left text-sm transition-colors flex items-center gap-2 ${
                            selected
                              ? "bg-cyan-500/30 text-cyan-200"
                              : "text-neutral-300 hover:bg-white/10"
                          }`}
                        >
                          <span className="truncate">{id}</span>
                          {node.type && (
                            <span className="text-[10px] text-neutral-500 shrink-0">
                              {node.type}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {noPathMessage && (
            <p className="text-xs text-amber-400/90">
              No path found between these nodes.
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleFindConnection}
              disabled={!canFind}
              className="hover:cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500/30 border border-cyan-500/50 text-cyan-200 hover:bg-cyan-500/40 disabled:opacity-50 disabled:pointer-events-none text-sm font-medium transition-colors"
            >
              <Route size={16} />
              Find Connection
            </button>
            <button
              type="button"
              onClick={handleClearClose}
              className="hover:cursor-pointer px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors"
            >
              Clear / Close
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
