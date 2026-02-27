/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CloseButton from "./ui/CloseButton";
import { ChevronLeft, ChevronRight, Hash, Save, Plus, X, Globe, ExternalLink, LinkIcon, AlertCircle, Layers } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";
import type { Group } from "../hooks/useGroups";

interface SidebarProps {
    selectedNode: any | null;
    onClose: () => void;
    onUpdateNode: (nodeId: string, newData: { title?: string, content?: string, tags?: string[], url?: string, group_id?: string | null }) => void;
    allNodes: { nodes: any[], links: any[] };
    onDeleteLink: (sourceId: string, targetId: string) => void;
    onAddLink: (sourceId: string, targetId: string) => void;
    groups: Group[];
    onAddGroup: (name: string, color: string) => Promise<Group | null>;
}

export default function Sidebar({ selectedNode, allNodes, onClose, onUpdateNode, onAddLink, onDeleteLink, groups, onAddGroup }: SidebarProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editUrl, setEditUrl] = useState("");
    const [editTags, setEditTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState("");
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<any>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    const [connectionSearch, setConnectionSearch] = useState("");
    const [isConnListOpen, setIsConnListOpen] = useState(false);
    const [editGroupId, setEditGroupId] = useState<string | null>(null);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

    const [scrollShadows, setScrollShadows] = useState({ top: false, bottom: false });
    const [connScrollShadows, setConnScrollShadows] = useState({ top: false, bottom: false });
    const scrollRef = useRef<HTMLDivElement>(null);
    const connScrollRef = useRef<HTMLDivElement>(null);

    const updateScrollShadows = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        setScrollShadows({
            top: scrollTop > 8,
            bottom: scrollHeight - scrollTop - clientHeight > 8,
        });
    }, []);
    const updateConnScrollShadows = useCallback(() => {
        const el = connScrollRef.current;
        if (!el) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        setConnScrollShadows({
            top: scrollTop > 4,
            bottom: scrollHeight - scrollTop - clientHeight > 4,
        });
    }, []);

    const nodeConnections = useMemo(() => {
        // Якщо нода не вибрана або у нас немає даних про лінки, повертаємо порожній масив
        if (!selectedNode || !allNodes?.links) return [];

        const selectedId = typeof selectedNode.id === 'string' ? selectedNode.id : selectedNode.id?.id;

        return allNodes.links
            .filter(l => {
                const s = typeof l.source === 'object' ? l.source.id : l.source;
                const t = typeof l.target === 'object' ? l.target.id : l.target;
                return s === selectedId || t === selectedId;
            })
            .map(l => {
                const s = typeof l.source === 'object' ? l.source.id : l.source;
                const t = typeof l.target === 'object' ? l.target.id : l.target;
                return s === selectedId ? t : s;
            });
    }, [selectedNode, allNodes.links]);

    useEffect(() => {
        updateScrollShadows();
        const el = scrollRef.current;
        if (!el) return;
        const ro = new ResizeObserver(updateScrollShadows);
        ro.observe(el);
        return () => ro.disconnect();
    }, [updateScrollShadows]);

    useEffect(() => {
        updateConnScrollShadows();
        const el = connScrollRef.current;
        if (!el) return;
        const ro = new ResizeObserver(updateConnScrollShadows);
        ro.observe(el);
        return () => ro.disconnect();
    }, [updateConnScrollShadows, nodeConnections.length]);

    const minWidth = 320;
    const maxWidth = typeof window !== 'undefined' ? window.innerWidth / 3 : 400;

    useEffect(() => {
        const displayTitle = selectedNode?.title ?? selectedNode?.content ?? selectedNode?.id ?? '';
        const titleChanged = editTitle !== displayTitle;
        const contentChanged = editContent !== (selectedNode?.content || "");
        const tagsChanged = JSON.stringify(editTags) !== JSON.stringify(selectedNode?.tags || []);
        const urlChanged = editUrl !== (selectedNode?.url || "");
        const nodeGroupId = selectedNode?.group_id ?? null;
        const groupChanged = editGroupId !== nodeGroupId;

        setIsDirty(titleChanged || contentChanged || tagsChanged || urlChanged || groupChanged);
    }, [editContent, editTitle, editTags, selectedNode, editUrl, editGroupId]);

    useEffect(() => {
        if (selectedNode) {
            setEditTitle(selectedNode.title ?? selectedNode.content ?? selectedNode.id ?? "");
            setEditContent(selectedNode.content || "");
            setEditTags(selectedNode.tags || []);
            setEditUrl(selectedNode.url || "");
            setEditGroupId(selectedNode.group_id ?? null);
            setError(null);
            setConnectionSearch("");
            setIsConnListOpen(false);
        }
    }, [selectedNode]);

    useEffect(() => {
        const fetchPreview = async () => {
            if (selectedNode?.type === 'link' && editUrl) {
                setIsLoadingPreview(true);
                setPreviewData(null);

                let targetUrl = editUrl.toLowerCase().trim();
                if (!targetUrl.startsWith('http')) {
                    targetUrl = `https://${targetUrl}`;
                }

                try {
                    const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(targetUrl)}`);
                    const result = await response.json();

                    if (result.status === 'success') {
                        const { data } = result;
                        setPreviewData({
                            image: data.image?.url || data.logo?.url || null,
                            description: data.description || "No description available.",
                            siteName: data.publisher || data.author || "Web Source",
                            title: data.title || editTitle,
                            url: data.url
                        });
                    }
                } catch (error) {
                    console.error("Link Preview Error:", error);
                } finally {
                    setIsLoadingPreview(false);
                }
            }
        };
        fetchPreview();
    }, [selectedNode?.type, editUrl, editTitle]);

    const handleSave = async () => {
        if (!selectedNode || !isDirty) return;

        const trimmedTitle = editTitle.trim();
        if (!trimmedTitle) {
            setError("Title cannot be empty.");
            return;
        }

        const nodeId = typeof selectedNode.id === 'string' ? selectedNode.id : selectedNode.id?.id;
        try {
            await onUpdateNode(nodeId, {
                title: trimmedTitle,
                content: editContent,
                tags: editTags,
                url: editUrl.trim(),
                group_id: editGroupId
            });
            reset();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save.');
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    }

    const reset = () => {
        setIsDirty(false);
        setError(null);
        setIsLoadingPreview(true);
    }

    const addTag = () => {
        if (newTag.trim() && !editTags.includes(newTag.trim())) {
            setEditTags([...editTags, newTag.trim()]);
            setNewTag("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setEditTags(editTags.filter(t => t !== tagToRemove));
    };

    return (
        <AnimatePresence>
            {selectedNode && (
                <motion.div
                    key="sidebar-panel"
                    initial={{ x: '100%', opacity: 0, width: minWidth }}
                    animate={{ 
                        x: 0, 
                        opacity: 1,
                        width: isExpanded ? maxWidth : minWidth
                    }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', duration: 0.8, delay: 0.1 }}
                    className="fixed top-0 right-0 h-full w-80 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-2xl border-l border-black/10 dark:border-white/10 p-8 shadow-2xl z-50 flex flex-col"
                >
                    {/* Header */}
                    <div className="flex flex-row items-center justify-between w-full mb-10 min-h-10">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="hover:cursor-pointer text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                        >
                            {isExpanded ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        </button>
                        <AnimatePresence>
                            {isDirty && (
                                <motion.button
                                    initial={{ opacity: 0, x: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, x: 0 }}
                                    onClick={handleSave}
                                    className="hover:cursor-pointer flex items-center gap-2 px-4 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-full hover:bg-purple-500 shadow-lg shadow-purple-500/20"
                                >
                                    <Save size={14} /> Save
                                </motion.button>
                            )}
                        </AnimatePresence>
                        <div className="flex flex-row items-center gap-4">
                            
                            <CloseButton onClose={handleClose} />
                        </div>
                    </div>

                    <AnimatePresence>
                        {error && (
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
                                className="overflow-hidden mb-4"
                            >
                                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-sm font-medium">
                                    <AlertCircle size={16} className="shrink-0" />
                                    {error}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex-1 min-h-0 flex flex-col relative">
                        <div
                            ref={scrollRef}
                            onScroll={updateScrollShadows}
                            className="flex-1 overflow-y-auto scroll-hint space-y-8"
                        >
                        <div className="space-y-2">
                            <textarea
                                value={editTitle}
                                onChange={(e) => {
                                    setEditTitle(e.target.value);
                                    if (error) setError(null);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                className="no-scrollbar w-full bg-transparent text-4xl font-bold text-neutral-900 dark:text-white outline-none border-none p-0 resize-none placeholder-neutral-500 dark:placeholder-neutral-600 leading-tight"
                                placeholder="Node Name"
                                rows={2}
                            />

                            {selectedNode.type === 'link' && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl group focus-within:border-indigo-500/50 transition-all">
                                    <Globe size={14} className="text-neutral-500 dark:text-neutral-600 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400" />
                                    <input 
                                        value={editUrl}
                                        onChange={(e) => setEditUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="bg-transparent outline-none text-xs text-neutral-600 dark:text-neutral-400 w-full font-mono"
                                    />
                                    {editUrl && (
                                        <a href={editUrl.startsWith('http') ? editUrl : `https://${editUrl}`} target="_blank" className="text-neutral-500 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-white">
                                            <ExternalLink size={14} />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="no-scrollbar w-full bg-transparent text-neutral-600 dark:text-neutral-400 text-base leading-relaxed outline-none border-none p-0 resize-none placeholder-neutral-500 dark:placeholder-neutral-600 min-h-[150px]"
                                placeholder="Start writing your thoughts here..."
                            />
                        </div>

                        {selectedNode.type === 'link' && (
                            <div className="rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 group relative transition-all hover:border-black/20 dark:hover:border-white/20">
                                {isLoadingPreview ? (
                                    <div className="h-48 w-full bg-black/5 dark:bg-white/5 animate-pulse flex flex-col items-center justify-center gap-3">
                                        <Globe className="text-indigo-500/50 animate-spin" size={24} />
                                        <span className="text-[10px] text-neutral-500 dark:text-neutral-600 font-mono tracking-widest uppercase">Fetching data...</span>
                                    </div>
                                ) : (
                                    <>
                                        {previewData?.image ? (
                                            <div className="h-44 overflow-hidden relative">
                                                <img 
                                                    src={previewData.image} 
                                                    alt="Preview" 
                                                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-transparent to-transparent" />
                                            </div>
                                        ) : (
                                            <div className="h-20 flex items-center justify-center bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/5">
                                                <Globe size={20} className="text-neutral-600 dark:text-neutral-700" />
                                            </div>
                                        )}
                                        
                                        <div className="p-5 space-y-3">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest truncate">
                                                    {previewData?.siteName || "Website"}
                                                </p>
                                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white/90 leading-snug line-clamp-2">
                                                    {previewData?.title || editTitle}
                                                </h4>
                                            </div>

                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-3 font-light">
                                                {previewData?.description}
                                            </p>

                                            <a 
                                                href={editUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between w-full group/link pt-2"
                                            >
                                                <span className="text-[11px] text-neutral-500 dark:text-neutral-500 group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400 transition-colors flex items-center gap-2">
                                                    <ExternalLink size={12} />
                                                    Visit Source
                                                </span>
                                                <ChevronRight size={14} className="text-neutral-600 dark:text-neutral-700 group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400 group-hover/link:translate-x-1 transition-all" />
                                            </a>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-xs text-neutral-500 font-mono uppercase tracking-widest border-b border-white/5 pb-2">
                                <span>Properties</span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 items-center">
                                {editTags.map((tag, tagIndex) => (
                                    <span 
                                        key={tag ? String(tag) : `tag-${tagIndex}`} 
                                        className="group flex items-center gap-1.5 px-3 py-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-md text-[11px] text-neutral-600 dark:text-neutral-300 hover:border-red-500/50 hover:text-red-400 transition-all cursor-pointer"
                                        onClick={() => removeTag(tag)}
                                    >
                                        <Hash size={10} className="text-indigo-600 dark:text-purple-500" />
                                        {tag}
                                        <X size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </span>
                                ))}
                                <div className="flex items-center gap-1 bg-transparent border border-dashed border-black/10 dark:border-white/10 rounded-md px-2 py-1 focus-within:border-black/30 dark:focus-within:border-white/30 transition-all">
                                    <Plus size={10} className="text-neutral-500 dark:text-neutral-600" />
                                    <input 
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                        placeholder="Add tag..."
                                        className="bg-transparent outline-none text-[11px] text-neutral-600 dark:text-neutral-300 w-16 focus:w-24 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-4">
                                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-mono uppercase tracking-widest border-b border-black/10 dark:border-white/5 pb-2">
                                    <span className="flex items-center gap-2">
                                        <Layers size={12} />
                                        Category
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateGroupOpen(true)}
                                        className="hover:cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium text-indigo-600 dark:text-purple-400 hover:bg-indigo-500/10 dark:hover:bg-purple-500/10 transition-colors"
                                    >
                                        <Plus size={12} /> New group
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {groups.map((g, groupIndex) => (
                                        <button
                                            key={g?.id ? String(g.id) : `group-${groupIndex}`}
                                            type="button"
                                            onClick={() => setEditGroupId(g.id)}
                                            className={`hover:cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-sm transition-colors ${
                                                editGroupId === g.id
                                                    ? "bg-indigo-500/15 dark:bg-purple-500/15 border-indigo-500/40 dark:border-purple-500/40 text-indigo-700 dark:text-purple-300"
                                                    : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:bg-black/10 dark:hover:bg-white/10"
                                            }`}
                                        >
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: g.color }}
                                            />
                                            <span className="truncate max-w-[140px]">{g.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 pt-6">
                                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-mono uppercase tracking-widest border-b border-black/10 dark:border-white/5 pb-2">
                                    <span>Connections</span>
                                    <span className="text-neutral-600 dark:text-neutral-700">{nodeConnections.length}</span>
                                </div>

                                {/* Список існуючих зв'язків */}
                                <div className="relative max-h-40">
                                    <div
                                        ref={connScrollRef}
                                        onScroll={updateConnScrollShadows}
                                        className="space-y-2 max-h-40 overflow-y-auto scroll-hint"
                                    >
                                    {nodeConnections.map((connId: any, index) => {
                                        const connNode = allNodes.nodes.find((n: any) => (typeof n.id === 'string' ? n.id : n.id?.id) === connId);
                                        const connLabel = connNode ? (connNode.title ?? connNode.content ?? connId) : connId;
                                        const selectedId = typeof selectedNode.id === 'string' ? selectedNode.id : selectedNode.id?.id;
                                        return (
                                            <div key={connId + index} className="flex items-center justify-between group/conn p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-lg text-neutral-500 dark:text-neutral-500 group-hover/conn:text-indigo-600 dark:group-hover/conn:text-indigo-400 transition-colors">
                                                        <LinkIcon size={14} />
                                                    </div>
                                                    <span className="text-sm text-neutral-600 dark:text-neutral-400 group-hover/conn:text-neutral-900 dark:group-hover/conn:text-white transition-colors">{connLabel}</span>
                                                </div>
                                                <button
                                                    onClick={() => onDeleteLink(selectedId, connId)}
                                                    className="opacity-0 group-hover/conn:opacity-100 p-2 text-neutral-500 dark:text-neutral-600 hover:text-red-400 transition-all"
                                                >
                                                    <X size={14} className="hover:cursor-pointer" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    </div>
                                    {connScrollShadows.top && (
                                        <div
                                            className="absolute left-0 right-0 top-0 h-4 bg-gradient-to-b from-white/90 to-transparent dark:from-neutral-950/90 pointer-events-none z-10 rounded-t-xl"
                                            aria-hidden
                                        />
                                    )}
                                    {connScrollShadows.bottom && (
                                        <div
                                            className="absolute left-0 right-0 bottom-0 h-4 bg-gradient-to-t from-white/90 to-transparent dark:from-neutral-950/90 pointer-events-none z-10 rounded-b-xl"
                                            aria-hidden
                                        />
                                    )}
                                </div>

                                {/* Кастомний Select / Пошук нових зв'язків */}
                                <div className="relative pt-2">
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            value={connectionSearch}
                                            onChange={(e) => {
                                                setConnectionSearch(e.target.value);
                                                if (!isConnListOpen) setIsConnListOpen(true);
                                            }}
                                            onClick={() => setIsConnListOpen((prev) => !prev)}
                                            onFocus={() => setIsConnListOpen(true)}
                                            placeholder="+ Connect to another neuron..."
                                            className="w-full bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 rounded-xl p-3 text-xs text-neutral-600 dark:text-neutral-400 outline-none focus:border-indigo-500/50 focus:bg-black/10 dark:focus:bg-white/10 transition-all"
                                        />
                                        {connectionSearch && (
                                            <button 
                                                onClick={() => {setConnectionSearch(""); setIsConnListOpen(false);}}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-white"
                                            >
                                                <X size={14} className="hover:cursor-pointer" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Випадаючий список результатів */}
                                    <AnimatePresence>
                                        {isConnListOpen && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto scroll-hint backdrop-blur-xl"
                                            >
                                                {allNodes.nodes
                                                    .filter(n => {
                                                        const nodeId = typeof n.id === 'string' ? n.id : n.id?.id;
                                                        const selectedId = typeof selectedNode.id === 'string' ? selectedNode.id : selectedNode.id?.id;
                                                        const label = (n.title ?? n.content ?? n.id ?? '').toString().toLowerCase();
                                                        const matchesSearch = label.includes(connectionSearch.toLowerCase());
                                                        return nodeId !== selectedId && !nodeConnections.includes(nodeId) && matchesSearch;
                                                    })
                                                    .map((node) => {
                                                        const idStr = typeof node.id === 'string' ? node.id : node.id?.id;
                                                        const label = node.title ?? node.content ?? idStr;
                                                        const selectedId = typeof selectedNode.id === 'string' ? selectedNode.id : selectedNode.id?.id;
                                                        return (
                                                            <button
                                                                key={idStr}
                                                                onClick={() => {
                                                                    onAddLink(selectedId, idStr);
                                                                    setConnectionSearch("");
                                                                    setIsConnListOpen(false);
                                                                }}
                                                                className="hover:cursor-pointer w-full flex items-center justify-between px-4 py-3 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors group border-b border-black/10 dark:border-white/5 last:border-none"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-neutral-500 dark:text-neutral-500">
                                                                        <Plus size={14} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-neutral-900 dark:text-white text-sm font-medium">{label}</p>
                                                                        {node.tags && node.tags.length > 0 && (
                                                                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">#{node.tags[0]}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-widest">
                                                                    Connect +
                                                                </span>
                                                            </button>
                                                        );
                                                    })
                                                }
                                                {/* Якщо нічого не знайдено */}
                                                {allNodes.nodes.filter(n => {
                                                    const label = (n.title ?? n.content ?? n.id ?? '').toString().toLowerCase();
                                                    return label.includes(connectionSearch.toLowerCase());
                                                }).length === 0 && (
                                                    <div className="p-4 text-center text-xs text-neutral-500 dark:text-neutral-600 italic">
                                                        No neurons found...
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    {isConnListOpen && (
                                        <div 
                                            className="fixed inset-0 z-40" 
                                            onClick={() => setIsConnListOpen(false)} 
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                        </div>
                        {scrollShadows.top && (
                            <div
                                className="absolute left-0 right-0 top-0 h-6 bg-gradient-to-b from-white/90 to-transparent dark:from-neutral-950/90 pointer-events-none z-10"
                                aria-hidden
                            />
                        )}
                        {scrollShadows.bottom && (
                            <div
                                className="absolute left-0 right-0 bottom-0 h-6 bg-gradient-to-t from-white/90 to-transparent dark:from-neutral-950/90 pointer-events-none z-10"
                                aria-hidden
                            />
                        )}
                    </div>
                </motion.div>
            )}
            <CreateGroupModal
                key="sidebar-create-group-modal"
                isOpen={isCreateGroupOpen}
                onClose={() => setIsCreateGroupOpen(false)}
                onCreate={async (name, color) => {
                    const newGroup = await onAddGroup(name, color);
                    if (newGroup) setEditGroupId(newGroup.id);
                }}
            />
        </AnimatePresence>
    );
}