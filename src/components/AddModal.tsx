/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FileText, GitMerge, Hash, Lightbulb, LinkIcon, Sparkles, X } from "lucide-react";
import CloseButton from "./ui/CloseButton";

export interface NodeData {
    type: 'link' | 'note' | 'idea';
    title: string;
    content?: string;
    tags: string[];
    connections: string[];
    autoConnectAI: boolean;
}

interface AddModalProps {
    isOpen: boolean;
    existingNodes: string[];
    onClose: () => void;
    onAdd: (data: NodeData) => void;
}

export default function AddModal({ isOpen, existingNodes, onAdd, onClose }: AddModalProps) {
    const [activeTab, setActiveTab] = useState<'link' | 'note' | 'idea'>('link');
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");

    const [connections, setConnections] = useState<string[]>([]);
    const [connectionSearch, setConnectionSearch] = useState("");
    const [showConnectionDropdown, setShowConnectionDropdown] = useState(false);

    const [autoConnectAI, setAutoConnectAI] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        
        const selectedTags = autoConnectAI ? [] : tags;

        onAdd({
            type: activeTab,
            title: title.trim(),
            content: content.trim(),
            tags: selectedTags,
            connections,
            autoConnectAI,
        });

        setTitle("");
        setContent("");
        setTags([]);
        setConnections([]);
        setConnectionSearch("");
        setAutoConnectAI(true);
        onClose();
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

    const filteredNodes = existingNodes.filter(nodeId => 
        nodeId.toLowerCase().includes(connectionSearch.toLowerCase()) &&
        !connections.includes(nodeId) &&
        nodeId !== title
    );

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
                        className="relative w-full max-w-md p-6 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl"
                    >
                        <CloseButton onClose={onClose} size={20} />
                        
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                            <Sparkles className="text-purple-500" size={24} />
                            New Neuron
                        </h2>

                        <div className="flex p-1 mb-6 bg-black/50 rounded-xl mt-6">
                            {[
                                { id: 'link', icon: LinkIcon, label: 'Link' },
                                { id: 'note', icon: FileText, label: 'Note' },
                                { id: 'idea', icon: Lightbulb, label: 'Idea' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`hover:cursor-pointer flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                                        activeTab === tab.id 
                                        ? 'bg-neutral-800 text-white shadow-sm' 
                                        : 'text-neutral-500 hover:text-neutral-300'
                                    }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label htmlFor="title-input" className="block text-sm font-medium text-neutral-300">
                                    {activeTab === 'link' ? 'URL' : activeTab === 'note' ? 'Title' : 'Idea Title'}
                                </label>
                                <input
                                    id="title-input"
                                    type={activeTab === 'link' ? "url" : "text"}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={
                                        activeTab === 'link' ? "https://..." : 
                                        activeTab === 'note' ? "Note title..." : "Brief essence of the idea..."
                                    }
                                    className="mt-1 w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                                    autoFocus
                                />
                            </div>

                            {activeTab !== 'link' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                                    <label htmlFor="content-input" className="block text-sm font-medium text-neutral-300">
                                        {activeTab === 'note' ? 'Content' : 'Description'}
                                    </label>
                                    <textarea
                                        id="content-input"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Write in more detail..."
                                        rows={3}
                                        className="mt-1 w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50 transition-colors resize-none mt-1"
                                    />
                                </motion.div>
                            )}

                            <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <Sparkles size={16} className="text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-purple-100">AI Synchronization</p>
                                        <p className="text-xs text-purple-300/60">AI will analyze the content and find connections</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAutoConnectAI(!autoConnectAI)}
                                    className={`hover:cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autoConnectAI ? 'bg-purple-500' : 'bg-neutral-600'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoConnectAI ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {!autoConnectAI && (
                                <motion.div initial={{ opacity: 1, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                                    <label htmlFor="link-input" className="block text-sm font-medium text-neutral-300">
                                        Link
                                    </label>
                                    <div id="link-input" className="mt-1 relative bg-black/50 border border-white/10 rounded-xl p-2 focus-within:border-blue-500/50 transition-colors">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {connections.map(conn => (
                                                <span key={conn} className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-xs text-blue-300 border border-blue-500/30 rounded-md">
                                                    <GitMerge size={12} />
                                                    {conn}
                                                    <button type="button" onClick={() => setConnections(connections.filter(c => c !== conn))} className="ml-1 hover:text-white">
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <GitMerge size={16} className="text-neutral-500 ml-2" />
                                            <input
                                                type="text"
                                                value={connectionSearch}
                                                onChange={(e) => {
                                                    setConnectionSearch(e.target.value);
                                                    setShowConnectionDropdown(true);
                                                }}
                                                onFocus={() => setShowConnectionDropdown(true)}
                                                onBlur={() => setTimeout(() => setShowConnectionDropdown(false), 200)}
                                                placeholder="Link with... (enter existing neuron name)"
                                                className="w-full bg-transparent text-sm text-white placeholder-neutral-600 focus:outline-none py-1"
                                            />
                                        </div>
                                        <AnimatePresence>
                                            {showConnectionDropdown && filteredNodes.length > 0 && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                                    className="absolute left-0 right-0 top-[105%] mt-1 bg-neutral-800 border border-white/10 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto no-scrollbar"
                                                >
                                                {filteredNodes.map(nodeId => (
                                                    <button
                                                        key={nodeId}
                                                        type="button"
                                                        onClick={() => {
                                                            setConnections([...connections, nodeId]);
                                                            setConnectionSearch("");
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-white/10 hover:text-white transition-colors border-b border-white/5 last:border-0"
                                                    >
                                                        {nodeId}
                                                    </button>
                                                ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            )}

                            <div>
                                <label htmlFor="tags-input" className="block text-sm font-medium text-neutral-300">
                                    Tags
                                </label>
                                <div className="mt-1 bg-black/50 border border-white/10 rounded-xl p-2 focus-within:border-purple-500/50 transition-colors">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {tags.map(tag => (
                                            <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-white/10 text-xs text-white rounded-md">
                                                <Hash size={12} className="text-purple-400" />
                                                {tag}
                                                <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-red-400">
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        id="tags-input"
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Add tag (press Enter)..."
                                        className="w-full bg-transparent text-sm text-white placeholder-neutral-600 focus:outline-none px-2 py-1"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!title.trim()}
                                className="w-full mt-4 py-3 bg-white text-black font-semibold rounded-xl hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
