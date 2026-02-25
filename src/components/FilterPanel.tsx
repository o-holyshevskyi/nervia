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
        <div className="flex flex-col gap-2 overflow-y-auto pr-2 mt-4">
            <button
                onClick={() => {
                    onTagSelect(null);
                    onClose();
                }}
                className={`hover:cursor-pointer flex items-center w-full text-left px-3 py-3 rounded-xl transition-all ${
                activeTag === null 
                    ? "bg-white/10 text-purple-400 font-medium shadow-sm" 
                    : "text-white hover:text-white hover:bg-white/5"
                }`}
            >
                <Globe size={18} className="mr-3" />
                All Neurones
            </button>

            <div className="h-px w-full bg-white/10 my-4"></div>

            <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2 px-1">
                Your collections (Tags)
            </div>

            {tags.length === 0 ? (
                <p className="text-sm text-neutral-600 italic px-1">No available tags</p>
            ) : (
                <div className='max-h-[50vh] overflow-y-auto no-scrollbar'>
                    {tags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => {
                                onTagSelect(tag === activeTag ? null : tag);
                            }}
                            className={`hover:cursor-pointer flex items-center w-full text-left px-3 py-2.5 rounded-xl transition-all group ${
                                activeTag === tag 
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
                                : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
                            }`}
                        >
                            <Hash size={16} className={`mr-3 ${activeTag === tag ? "text-purple-400" : "text-neutral-600 group-hover:text-neutral-400"}`} />
                            <span className="truncate">{tag}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}