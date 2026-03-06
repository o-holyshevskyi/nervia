/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { FileText, GitMerge, Hash, Lightbulb, LinkIcon, Sparkles, X, Plus, AlertCircle, Globe } from "lucide-react";
import CloseButton from "./ui/CloseButton";

const GENESIS_NEURON_LIMIT = 60;
const GENESIS_UPGRADE_THRESHOLD = 50;

export interface NodeData {
    type: 'link' | 'note' | 'idea';
    title: string;
    content?: string;
    url?: string;
    tags: string[];
    connections: string[];
    autoConnectAI: boolean;
}

function normalizeUrlForCompare(url: string | undefined): string {
    if (url == null || typeof url !== 'string') return '';
    const t = url.trim().toLowerCase();
    if (!t) return '';
    return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

interface AddModalProps {
    isOpen: boolean;
    existingNodes: any[];
    allTags: string[];
    onClose: () => void;
    onAdd: (data: NodeData) => void;
    submitError?: string | null;
    onUpgradeRequest?: () => void;
    neuronLimit?: number;
    /** When true, show "reaching limit" upgrade banner for Genesis. When false (Constellation/Singularity), never show it. */
    showGenesisUpgradeBanner?: boolean;
}

export default function AddModal({ isOpen, existingNodes, allTags, onAdd, onClose, submitError, onUpgradeRequest, neuronLimit = GENESIS_NEURON_LIMIT, showGenesisUpgradeBanner = false }: AddModalProps) {
    const [activeTab, setActiveTab] = useState<'link' | 'note' | 'idea'>('link');
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [content, setContent] = useState("");
    const [error, setError] = useState<string | null>(null);

    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [showTagDropdown, setShowTagDropdown] = useState(false);

    const [connections, setConnections] = useState<string[]>([]);
    const [connectionSearch, setConnectionSearch] = useState("");
    const [showConnectionDropdown, setShowConnectionDropdown] = useState(false);

    const [autoConnectAI, setAutoConnectAI] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;

        if (existingNodes.length >= neuronLimit) {
            onUpgradeRequest?.();
            return;
        }

        const isDuplicateTitle = existingNodes.some((n: any) =>
            (n.title ?? n.content ?? n.id ?? '').toString().toLowerCase() === trimmedTitle.toLowerCase()
        );
        if (isDuplicateTitle) {
            setError(`A neuron named "${trimmedTitle}" already exists in your universe.`);
            return;
        }

        if (activeTab === 'link' && url.trim()) {
            const urlNorm = normalizeUrlForCompare(url);
            const isDuplicateUrl = existingNodes.some((n: any) => {
                const u = (n.url ?? '').toString().trim();
                return u && normalizeUrlForCompare(u) === urlNorm;
            });
            if (isDuplicateUrl) {
                setError('A neuron with this URL already exists.');
                return;
            }
        }

        onAdd({
            type: activeTab,
            title: trimmedTitle,
            content: content.trim(),
            url: activeTab === 'link' ? url.trim() : undefined,
            tags,
            connections,
            autoConnectAI,
        });

        resetForm();
    };

    const handleClose = () => {
        resetForm();
    }

    const resetForm = () => {
        setTitle("");
        setContent("");
        setTags([]);
        setTagInput("");
        setUrl("");
        setConnections([]);
        setConnectionSearch("");
        setAutoConnectAI(true);
        setShowTagDropdown(false);
        setError(null);
        onClose();
    };

    const addTag = (newTag: string) => {
        const formattedTag = newTag.trim().toLowerCase();
        if (formattedTag && !tags.includes(formattedTag)) {
            setTags([...tags, formattedTag]);
        }
        setTagInput("");
        setShowTagDropdown(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
        
            const newTag = tagInput.trim().toLowerCase();
            if (!tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }

            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const getNodeLabel = (n: any) => (n.title ?? n.content ?? n.id ?? '').toString();
    const getNodeId = (n: any) => typeof n.id === 'string' ? n.id : n.id?.id;
    const filteredNodes = existingNodes.filter((n: any) => {
        const label = getNodeLabel(n).toLowerCase();
        const id = getNodeId(n);
        return label.includes(connectionSearch.toLowerCase()) &&
            !connections.includes(id) &&
            label !== title.trim().toLowerCase();
    });

    const filteredTags = allTags.filter(t => 
        t.toLowerCase().includes(tagInput.toLowerCase()) && 
        !tags.includes(t)
    );

    const isTagNew = tagInput.trim() !== "" && !allTags.some(t => t.toLowerCase() === tagInput.trim().toLowerCase()) && !tags.includes(tagInput.trim().toLowerCase());

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ 
                            duration: 0.4, 
                            type: "tween", 
                            delay: 0.1,
                            ease: [0, 0.71, 0.2, 1.01] 
                        }}
                        className="relative w-full max-w-md p-6 bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl"
                    >
                        <div className="flex flex-row items-center justify-between">
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                                <Sparkles className="text-indigo-600 dark:text-purple-500" size={24} />
                                New Neuron
                            </h2>

                            <div className="self-end mb-2">
                                <CloseButton onClose={handleClose} size={20} />
                            </div>
                        </div>

                        <div className="flex p-1 mb-6 bg-black/10 dark:bg-black/50 rounded-xl mt-6 relative">
                            {[
                                { id: 'link', icon: LinkIcon, label: 'Source' },
                                { id: 'note', icon: FileText, label: 'Memory' },
                                { id: 'idea', icon: Lightbulb, label: 'Impulse' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`relative hover:cursor-pointer flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg z-10 transition-colors duration-300 ${
                                        activeTab === tab.id 
                                        ? 'text-neutral-900 dark:text-white' 
                                        : 'text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                                    }`}
                                >
                                    {/* 🔥 Анімований фон для активного таба */}
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTabIndicator" // Це магічний ключ для плавної анімації між кнопками
                                            className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800 rounded-lg shadow-sm"
                                            initial={false} // Забороняємо анімацію при першому рендері
                                            transition={{ 
                                                type: "spring", 
                                                stiffness: 400, 
                                                damping: 30 
                                            }}
                                        />
                                    )}
                                    
                                    {/* Контент кнопки (іконка і текст) має бути над анімованим фоном (relative z-10) */}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <tab.icon size={16} />
                                        {tab.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                                    {activeTab === 'link' ? 'Display Name' : 'Title'}
                                </label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={activeTab === 'link' ? "e.g. My Portfolio" : "Title..."}
                                    className="w-full px-4 py-3 bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl text-neutral-900 dark:text-white outline-none focus:border-indigo-500/50 dark:focus:border-purple-500/50"
                                    autoFocus
                                />
                            </div>

                            <AnimatePresence>
                                {activeTab === 'link' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">Source URL</label>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-600" size={16} />
                                            <input
                                                type="url"
                                                value={url}
                                                onChange={(e) => setUrl(e.target.value)}
                                                placeholder="https://example.com"
                                                className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl text-neutral-900 dark:text-white outline-none focus:border-indigo-500/50 transition-all font-mono text-sm"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {activeTab !== 'link' && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }} 
                                        animate={{ opacity: 1, height: "auto" }} 
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <label htmlFor="title-input" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                                            <AnimatePresence mode="wait">
                                                <motion.span
                                                    key={`label-${activeTab}`}
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -5 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="inline-block"
                                                >
                                                    {activeTab === 'note' ? 'Content' : 'Description'}
                                                </motion.span>
                                            </AnimatePresence>
                                        </label>
                                        <textarea
                                            id="content-input"
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            placeholder="Write in more detail..."
                                            rows={3}
                                            className="mt-1 w-full px-4 py-3 bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 dark:focus:border-purple-500/50 transition-colors resize-none mt-1 simple-scrollbar"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-center justify-between bg-indigo-500/10 dark:bg-purple-500/10 border border-indigo-500/20 dark:border-purple-500/20 rounded-xl p-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/20 dark:bg-purple-500/20 rounded-lg">
                                        <Sparkles size={16} className="text-indigo-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-indigo-900 dark:text-purple-100">AI Synchronization</p>
                                        <p className="text-xs text-indigo-700/80 dark:text-purple-300/60">AI will analyze the content and find connections</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAutoConnectAI(!autoConnectAI)}
                                    className={`hover:cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autoConnectAI ? 'bg-indigo-500 dark:bg-purple-500' : 'bg-neutral-400 dark:bg-neutral-600'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoConnectAI ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <AnimatePresence>
                                {!autoConnectAI && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                                        animate={{ opacity: 1, height: "auto", transitionEnd: { overflow: "visible" } }} 
                                        exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                                    >
                                        <div className="pt-4 pb-1"> 
                                            <label htmlFor="link-input" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">
                                                Neural Links
                                            </label>
                                            <div id="link-input" className="mt-1 relative bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl p-2 focus-within:border-blue-500/50 transition-colors">
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {connections.map(connId => {
                                                        const node = existingNodes.find((n: any) => getNodeId(n) === connId);
                                                        const label = node ? getNodeLabel(node) : connId;
                                                        return (
                                                            <span key={connId} className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-xs text-blue-700 dark:text-blue-300 border border-blue-500/30 rounded-md">
                                                                <GitMerge size={12} />
                                                                {label}
                                                                <button type="button" onClick={() => setConnections(connections.filter(c => c !== connId))} className="ml-1 hover:text-neutral-900 dark:hover:text-white">
                                                                    <X size={12} />
                                                                </button>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <GitMerge size={16} className="text-neutral-500 dark:text-neutral-500 ml-2" />
                                                    <input
                                                        type="text"
                                                        value={connectionSearch}
                                                        onChange={(e) => {
                                                            setConnectionSearch(e.target.value);
                                                            setShowConnectionDropdown(true);
                                                        }}
                                                        onFocus={() => setShowConnectionDropdown(true)}
                                                        onBlur={() => setTimeout(() => setShowConnectionDropdown(false), 200)}
                                                        placeholder="Neural link to... (enter neuron name)"
                                                        className="w-full bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-600 focus:outline-none py-1"
                                                    />
                                                </div>
                                                
                                                <AnimatePresence>
                                                    {showConnectionDropdown && filteredNodes.length > 0 && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                                            className="absolute left-0 right-0 top-[105%] mt-1 bg-white dark:bg-neutral-800 border border-black/10 dark:border-white/10 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto simple-scrollbar"
                                                        >
                                                            {filteredNodes.map((n: any) => (
                                                                <button
                                                                    key={getNodeId(n)}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setConnections([...connections, getNodeId(n)]);
                                                                        setConnectionSearch("");
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white transition-colors border-b border-black/10 dark:border-white/5 last:border-0"
                                                                >
                                                                    {getNodeLabel(n)}
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="relative z-40">
                                <label htmlFor="tags-input" className="block text-sm font-medium text-neutral-300">
                                    Tags
                                </label>
                                <div className="mt-1 relative bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl p-2 focus-within:border-indigo-500/50 dark:focus-within:border-purple-500/50 transition-colors">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {tags.map(tag => (
                                            <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-black/10 dark:bg-white/10 text-xs text-neutral-900 dark:text-white rounded-md border border-black/10 dark:border-white/5">
                                                <Hash size={12} className="text-indigo-600 dark:text-purple-400" />
                                                {tag}
                                                <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Hash size={16} className="text-neutral-500 ml-1" />
                                        <input
                                            id="tags-input"
                                            type="text"
                                            value={tagInput}
                                            onChange={(e) => {
                                                setTagInput(e.target.value);
                                                setShowTagDropdown(true);
                                            }}
                                            onFocus={() => setShowTagDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Search or create tag (press Enter)..."
                                            className="w-full bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-600 focus:outline-none py-1"
                                            autoComplete="off"
                                        />
                                    </div>
                                    
                                    <AnimatePresence>
                                        {showTagDropdown && (tagInput || filteredTags.length > 0) && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                                className="absolute left-0 right-0 top-[105%] mt-1 bg-white dark:bg-neutral-800 border border-black/10 dark:border-white/10 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto simple-scrollbar"
                                            >
                                                {isTagNew && (
                                                    <button
                                                        type="button"
                                                        onClick={() => addTag(tagInput)}
                                                        className="hover:cursor-pointer w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-indigo-600 dark:text-purple-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors border-b border-black/10 dark:border-white/5"
                                                    >
                                                        <Plus size={14} />
                                                        Create &quot;{tagInput.toLowerCase()}&quot;
                                                    </button>
                                                )}
                                                
                                                {filteredTags.map(tag => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => addTag(tag)}
                                                        className="hover:cursor-pointer w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white transition-colors border-b border-black/10 dark:border-white/5 last:border-0"
                                                    >
                                                        <Hash size={14} className="text-neutral-500 dark:text-neutral-500" />
                                                        {tag}
                                                    </button>
                                                ))}
                                                
                                                {filteredTags.length === 0 && !isTagNew && tagInput === "" && (
                                                    <div className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-500 text-center italic">
                                                        No tags available
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <AnimatePresence>
                                {(submitError || error) && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, x: 0 }}
                                        animate={{ 
                                            opacity: 1, 
                                            height: 'auto',
                                            x: [0, -10, 10, -10, 10, -5, 5, 0] 
                                        }}
                                        exit={{ opacity: 0, height: 0, x: 0 }}
                                        transition={{ 
                                            duration: 0.4,
                                            x: { duration: 0.4, ease: "easeInOut" } 
                                        }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-sm font-medium">
                                            <AlertCircle size={16} className="shrink-0" />
                                            {submitError || error}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {showGenesisUpgradeBanner && existingNodes.length >= GENESIS_UPGRADE_THRESHOLD && (
                                <div className="bg-indigo-500/10 dark:bg-purple-500/10 border border-indigo-500/20 dark:border-purple-500/20 p-2 rounded-lg text-xs text-neutral-700 dark:text-neutral-300">
                                    Your Genesis Universe is reaching its limit ({existingNodes.length}/{neuronLimit}).{" "}
                                    <Link
                                        href="/settings/billing"
                                        className="text-indigo-600 dark:text-purple-400 hover:text-indigo-700 dark:hover:text-purple-300 font-medium underline underline-offset-1"
                                    >
                                        Upgrade to Constellation
                                    </Link>{" "}
                                    for unlimited space.
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!title.trim()}
                                className="hover:cursor-pointer flex items-center justify-center gap-2 w-full mt-4 py-3.5 rounded-xl bg-indigo-500/20 dark:bg-purple-500/20 border border-indigo-500/40 dark:border-purple-500/40 text-indigo-700 dark:text-purple-300 hover:bg-indigo-500/30 dark:hover:bg-purple-500/30 hover:text-indigo-900 dark:hover:text-white font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.15)] dark:shadow-[0_0_20px_rgba(168,85,247,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save to universe
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
