"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Copy, Check } from "lucide-react";
import CloseButton from "./ui/CloseButton";
import type { Group } from "../hooks/useGroups";
import type { ShareScope } from "../hooks/useSharing";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  initialScope?: ShareScope;
  initialGroupIds?: string[];
  onCreateShare: (scope: ShareScope, groupIds?: string[]) => Promise<{ slug: string; url: string } | null>;
}

export default function ShareModal({
  isOpen,
  onClose,
  groups,
  initialScope = "ALL",
  initialGroupIds = [],
  onCreateShare,
}: ShareModalProps) {
  const [scope, setScope] = useState<ShareScope>(initialScope);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    () => new Set(initialGroupIds)
  );
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleGroup = (id: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateLink = async () => {
    setError(null);
    if (scope === "GROUPS" && selectedGroupIds.size === 0) {
      setError("Select at least one group.");
      return;
    }
    setIsCreating(true);
    try {
      const result = await onCreateShare(
        scope,
        scope === "GROUPS" ? Array.from(selectedGroupIds) : undefined
      );
      if (result) {
        const fullUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}${result.url}`
            : result.url;
        setGeneratedUrl(fullUrl);
      } else {
        setError("Failed to create share link.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create share link.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  };

  const handleClose = () => {
    setGeneratedUrl(null);
    setError(null);
    setScope(initialScope);
    setSelectedGroupIds(new Set(initialGroupIds));
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl shadow-xl z-50 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold tracking-widest text-neutral-700 dark:text-neutral-300 uppercase flex items-center gap-2">
                <Link2 size={18} className="text-indigo-600 dark:text-purple-400" />
                Share Universe
              </h3>
              <CloseButton onClose={handleClose} size={18} />
            </div>

            {!generatedUrl ? (
              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">
                    Scope
                  </span>
                  <div className="flex gap-2 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setScope("ALL")}
                      className={`hover:cursor-pointer flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        scope === "ALL"
                          ? "bg-indigo-500/20 dark:bg-purple-500/20 text-indigo-700 dark:text-purple-300 border border-indigo-500/30 dark:border-purple-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)] dark:shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                          : "text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      All Nodes
                    </button>
                    <button
                      type="button"
                      onClick={() => setScope("GROUPS")}
                      className={`hover:cursor-pointer flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        scope === "GROUPS"
                          ? "bg-indigo-500/20 dark:bg-purple-500/20 text-indigo-700 dark:text-purple-300 border border-indigo-500/30 dark:border-purple-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)] dark:shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                          : "text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      Specific Groups
                    </button>
                  </div>
                </div>

                {scope === "GROUPS" && (
                  <div>
                    <span className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">
                      Select groups
                    </span>
                    <div className="max-h-40 overflow-y-auto rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-2 space-y-1">
                      {groups.length === 0 ? (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 italic py-2 px-2">
                          No groups yet
                        </p>
                      ) : (
                        groups.map((g) => (
                          <label
                            key={g.id}
                            className="hover:cursor-pointer flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            <input
                              type="checkbox"
                              checked={selectedGroupIds.has(g.id)}
                              onChange={() => handleToggleGroup(g.id)}
                              className="rounded border-black/20 dark:border-white/20 text-indigo-600 dark:text-purple-500 focus:ring-indigo-500/50 dark:focus:ring-purple-500/50"
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: g.color }}
                            />
                            <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                              {g.name}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateLink}
                    disabled={
                      isCreating ||
                      (scope === "GROUPS" && selectedGroupIds.size === 0)
                    }
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-purple-600 hover:bg-indigo-700 dark:hover:bg-purple-700 rounded-lg disabled:opacity-50 disabled:pointer-events-none transition-colors flex items-center gap-2"
                  >
                    {isCreating ? "Creating…" : "Generate link"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Share link
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedUrl}
                    className="flex-1 px-3 py-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="hover:cursor-pointer px-4 py-2.5 rounded-lg bg-indigo-600 dark:bg-purple-600 hover:bg-indigo-700 dark:hover:bg-purple-700 text-white flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    {copied ? (
                      <Check size={18} />
                    ) : (
                      <Copy size={18} />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Anyone with this link can view the shared content (read-only).
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
