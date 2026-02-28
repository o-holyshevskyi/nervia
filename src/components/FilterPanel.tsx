"use client";

import { Hash, Globe } from "lucide-react";

interface FilterPanelProps {
  tags: string[];
  activeTag: string | null;
  onTagSelect: (tag: string | null) => void;
  onClose: () => void;
}

export default function FilterPanel({ tags, activeTag, onTagSelect, onClose }: FilterPanelProps) {
    if (tags.length === 0) return null;

    return (
        <div className="flex flex-col gap-1 overflow-y-auto pr-1">
            <button
                onClick={() => {
                    onTagSelect(null);
                    onClose();
                }}
                className={`hover:cursor-pointer flex items-center w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTag === null
                        ? "bg-indigo-500/20 dark:bg-white/10 text-indigo-600 dark:text-purple-400 font-medium"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                }`}
            >
                <Globe size={16} className="mr-2.5 shrink-0" />
                <span>All Neurons</span>
            </button>

            <div className="h-px w-full bg-black/10 dark:bg-white/10 my-1.5" />

            <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1 px-1">
                Your collections (Tags)
            </div>

            {tags.length === 0 ? (
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 italic px-1">No available tags</p>
            ) : (
                <div className="max-h-[40vh] overflow-y-auto scroll-hint space-y-0.5">
                    {tags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => {
                                onTagSelect(tag === activeTag ? null : tag);
                            }}
                            className={`hover:cursor-pointer flex items-center w-full text-left px-3 py-2 rounded-md text-sm transition-colors group ${
                                activeTag === tag
                                    ? "bg-indigo-500/20 dark:bg-purple-500/20 text-indigo-700 dark:text-purple-300 border border-indigo-500/30 dark:border-purple-500/30"
                                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-transparent"
                            }`}
                        >
                            <Hash size={14} className={`mr-2.5 shrink-0 ${activeTag === tag ? "text-indigo-600 dark:text-purple-400" : "text-neutral-500 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-400"}`} />
                            <span className="truncate">{tag}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}