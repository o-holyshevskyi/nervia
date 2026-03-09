/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import CloseButton from "./ui/CloseButton";
import { Hash, Save, Plus, X, Globe, ExternalLink, LinkIcon, AlertCircle, Layers, Maximize2, Minimize2, Sparkles, Check, Loader2, Lock, LocateFixed, Share2, Trash2, Sun, EyeIcon } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";
import type { Group } from "../hooks/useGroups";
import ReactMarkdown from 'react-markdown';

interface SidebarProps {
    selectedNode: any | null;
    onClose: () => void;
    onUpdateNode: (nodeId: string, newData: { title?: string, content?: string, tags?: string[], url?: string, group_id?: string | null }) => void;
    allNodes: { nodes: any[], links: any[] };
    onDeleteLink: (sourceId: string, targetId: string) => void;
    onAddLink: (sourceId: string, targetId: string) => void;
    groups: Group[];
    onAddGroup: (name: string, color: string) => Promise<Group | null>;
    /** Singularity only: allow "Ask Exocortex" for this node. When false, show upgrade CTA. */
    canUseNeuralCore?: boolean;
    onRequestUpgrade?: (targetPlan: "singularity" | "constellation") => void;
    /** Same actions as ContextMenu: locate in graph, deep focus (3D), delete node. */
    onLocateNode?: (nodeId: string) => void;
    onDeepFocus?: (nodeId: string) => void;
    onDelete?: (nodeId: string) => void;
    onZenMode?: (nodeId: string) => void;
}

export default function Sidebar({ selectedNode, allNodes, onClose, onUpdateNode, onAddLink, onDeleteLink, groups, onAddGroup, canUseNeuralCore = false, onRequestUpgrade, onLocateNode, onDeepFocus, onDelete, onZenMode }: SidebarProps) {
    // false = 30% екрану, true = 75% екрану
    const [isFocusMode, setIsFocusMode] = useState(false);
    
    // 🔥 NEW: Стан для контролю плавного переходу
    const [isTransitioning, setIsTransitioning] = useState(false);

    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editUrl, setEditUrl] = useState("");
    const [editTags, setEditTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState("");
    const [isDirty, setIsDirty] = useState(false);
    
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    
    const [error, setError] = useState<string | null>(null);
    const [isEditingContent, setIsEditingContent] = useState(false);

    const [connectionSearch, setConnectionSearch] = useState("");
    const [isConnListOpen, setIsConnListOpen] = useState(false);
    const [editGroupId, setEditGroupId] = useState<string | null>(null);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const titleTextareaRef = useRef<HTMLTextAreaElement>(null);

    const nodeConnections = useMemo(() => {
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
        const idStr = selectedNode ? (typeof selectedNode.id === 'string' ? selectedNode.id : selectedNode.id?.id ?? '') : '';
        const rawDisplay = (selectedNode?.title ?? selectedNode?.content ?? '').toString().trim();
        const displayTitle = rawDisplay === idStr ? '' : (rawDisplay || idStr || '');
        const titleChanged = editTitle !== displayTitle;
        const contentChanged = editContent !== (selectedNode?.content || "");
        const tagsChanged = JSON.stringify(editTags) !== JSON.stringify(selectedNode?.tags || []);
        const urlChanged = editUrl !== (selectedNode?.url || "");
        const groupChanged = editGroupId !== (selectedNode?.group_id ?? null);

        if (titleChanged || contentChanged || tagsChanged || urlChanged || groupChanged) {
            setIsDirty(true);
            setSaveStatus("idle");
        }
    }, [editContent, editTitle, editTags, selectedNode, editUrl, editGroupId]);

    useEffect(() => {
        if (selectedNode) {
            const idStr = typeof selectedNode.id === 'string' ? selectedNode.id : selectedNode.id?.id ?? '';
            const rawTitle = (selectedNode.title ?? selectedNode.content ?? '').toString().trim();
            setEditTitle(rawTitle === idStr ? '' : (rawTitle || ''));
            setEditContent(selectedNode.content || "");
            setEditTags(selectedNode.tags || []);
            setEditUrl(selectedNode.url || "");
            setEditGroupId(selectedNode.group_id ?? null);
            setError(null);
            setConnectionSearch("");
            setIsConnListOpen(false);
            setIsDirty(false);
            setSaveStatus("idle");
            setAiResponse(null);
        }
    }, [selectedNode]);

    useEffect(() => {
        const textarea = titleTextareaRef.current;
        if (!textarea) return;

        const adjustHeight = () => {
            textarea.style.height = '0px';
            textarea.style.height = textarea.scrollHeight + 'px';
        };

        adjustHeight();

        const resizeObserver = new ResizeObserver(() => adjustHeight());
        resizeObserver.observe(textarea);

        return () => resizeObserver.disconnect();
    }, [editTitle, isFocusMode]);

    const handleSave = useCallback(async () => {
        if (!selectedNode || !isDirty) return;
        
        const trimmedTitle = editTitle.trim();
        if (!trimmedTitle && !editContent) return; 

        const nodeId = typeof selectedNode.id === 'string' ? selectedNode.id : selectedNode.id?.id;
        
        try {
            setIsSaving(true);
            setSaveStatus("saving");
            
            await onUpdateNode(nodeId, {
                title: trimmedTitle,
                content: editContent,
                tags: editTags,
                url: editUrl.trim(),
                group_id: editGroupId
            });
            
            setIsDirty(false);
            setSaveStatus("saved");
            setError(null);
            
            setTimeout(() => {
                setSaveStatus("idle");
            }, 2000);
            
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save.');
            setSaveStatus("idle");
        } finally {
            setIsSaving(false);
        }
    }, [selectedNode, isDirty, editTitle, editContent, editTags, editUrl, editGroupId, onUpdateNode]);

    const handleAskExocortex = async () => {
        if (!selectedNode) return;

        setIsAiLoading(true);
        setAiResponse(null);

        const title = editTitle || "Untitled";
        const summary = editContent || "No content provided.";
        const contextNodes = [{ title, summary, tags: editTags }];
        const userQuestion = `
            Please analyze this specific neuron. Structure your response as follows:
            1. **Core Insight:** A one-sentence summary of what this neuron is fundamentally about.
            2. **Hidden Patterns:** What broader concepts or ideas does this connect to?
            3. **Suggested Action/Exploration:** What should I research or write about next to expand this thought?
            4. **Suggested Tags:** Provide 3-5 relevant tags (comma-separated) that I could add to this neuron.
                    `.trim();

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userQuestion, contextNodes }),
            });

            const data = await res.json();

            if (!res.ok) {
                const msg = typeof data?.error === "string" ? data.error : "Neural connection failed.";
                setAiResponse(`⚠️ ${msg}`);
                return;
            }

            if (typeof data?.reply === "string") {
                setAiResponse(data.reply);
            } else {
                setAiResponse("⚠️ No reply from the Exocortex.");
            }
        } catch (err) {
            setAiResponse("⚠️ Neural connection failed. The Exocortex is currently unresponsive.");
        } finally {
            setIsAiLoading(false);
        }
    };

    useEffect(() => {
        if (isDirty && !isSaving) {
            const timeoutId = setTimeout(() => {
                handleSave();
            }, 1000);

            return () => clearTimeout(timeoutId);
        }
    }, [isDirty, isSaving, handleSave]);

    // 🔥 NEW: Функція перемикання режимів з плавним Fade (розчиненням)
    const handleToggleFocus = () => {
        if (isTransitioning) return; // Запобігає спаму кліками
        
        // 1. Починаємо розчинення контенту
        setIsTransitioning(true);
        
        setTimeout(() => {
            // 2. Змінюємо ширину сітки, коли контент вже невидимий
            setIsFocusMode(prev => !prev);
            
            setTimeout(() => {
                // 3. Повертаємо контент на місце з новою структурою
                setIsTransitioning(false);
            }, 200); // Час на "перебудову" макету перед появою
        }, 150); // Час на розчинення
    };

    const handleClose = () => {
        if (isDirty) handleSave(); 
        
        setIsDirty(false);
        setError(null);
        setIsFocusMode(false);
        onClose();
    };

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
                    initial={{ x: '100%', opacity: 0, width: '30vw' }}
                    animate={{ 
                        x: 0, 
                        opacity: 1,
                        width: isFocusMode ? '75vw' : '30vw'
                    }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed top-0 right-0 h-full min-w-[320px] bg-white/90 dark:bg-[#0a0a0a]/95 backdrop-blur-2xl border-l border-black/10 dark:border-white/5 shadow-2xl z-50 flex flex-col"
                >
                    {/* Header: Minimalist Controls */}
                    <div className="flex flex-row items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleToggleFocus} // 🔥 Оновлено
                                className="cursor-pointer p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 transition-colors tooltip-trigger"
                                title={isFocusMode ? "Collapse to 30%" : "Expand to 75%"}
                            >
                                {isFocusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <AnimatePresence mode="wait">
                                {saveStatus === "saving" && (
                                    <motion.div
                                        key="saving"
                                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-transparent text-neutral-400 text-xs font-medium rounded-full"
                                    >
                                        <Loader2 size={14} className="animate-spin" /> <span>Saving...</span>
                                    </motion.div>
                                )}
                                {saveStatus === "saved" && (
                                    <motion.div
                                        key="saved"
                                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-transparent text-green-500 dark:text-green-400 text-xs font-medium rounded-full"
                                    >
                                        <Check size={14} /> <span>Saved</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <CloseButton onClose={handleClose} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar relative" ref={scrollRef}>
                        {/* 🔥 Обгортка, що розчиняється/з'являється під час транзишену */}
                        <motion.div 
                            layout
                            animate={{ 
                                opacity: isTransitioning ? 0 : 1,
                                filter: isTransitioning ? "blur(4px)" : "blur(0px)" 
                            }}
                            transition={{ duration: 0.15 }}
                            className={`py-8 w-full ${
                                isFocusMode 
                                ? 'flex flex-row-reverse justify-between gap-12 md:gap-20 pl-8 md:pl-16 pr-8 max-w-[1400px]' 
                                : 'flex flex-col gap-6 px-8'
                            }`}
                        >
                            
                            {/* ERROR ALERT */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-sm"
                                    >
                                        <AlertCircle size={16} /> {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className={`${isFocusMode ? 'w-[500px] shrink-0 sticky top-8 self-start flex flex-col gap-6' : 'w-full flex flex-col gap-3'}`}>
        
                                <motion.div layout className="flex flex-col gap-3 py-4 border-y border-black/5 dark:border-white/5">
                                
                                    {/* Link Property */}
                                    {selectedNode.type === 'link' && (
                                        <div className={`flex ${isFocusMode ? 'flex-col gap-1.5' : 'items-center gap-4'}`}>
                                            <div className={`${isFocusMode ? 'w-full' : 'w-24 shrink-0'} flex items-center gap-2 text-neutral-400 text-xs font-medium`}>
                                                <Globe size={14} /> URL
                                            </div>
                                            <div className="w-full flex-1 flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-md px-2 py-1.5 focus-within:ring-1 ring-indigo-500/50">
                                                <input 
                                                    value={editUrl}
                                                    onChange={(e) => setEditUrl(e.target.value)}
                                                    placeholder="https://..."
                                                    className="bg-transparent outline-none text-sm text-neutral-700 dark:text-neutral-300 w-full font-mono placeholder-neutral-500"
                                                />
                                                {editUrl && (
                                                    <a href={editUrl.startsWith('http') ? editUrl : `https://${editUrl}`} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-indigo-400 cursor-pointer shrink-0">
                                                        <ExternalLink size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Cluster Property */}
                                    <div className={`flex ${isFocusMode ? 'flex-col gap-2' : 'items-start gap-4'}`}>
                                        <div className={`${isFocusMode ? 'w-full' : 'w-24 shrink-0 mt-1'} flex items-center gap-2 text-neutral-400 text-xs font-medium`}>
                                            <Layers size={14} /> Cluster
                                        </div>
                                        <div className="w-full flex-1 flex flex-wrap gap-1.5">
                                            {groups.map((g) => (
                                                <button
                                                    key={g.id}
                                                    onClick={() => setEditGroupId(g.id)}
                                                    className={`cursor-pointer px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                                                        editGroupId === g.id 
                                                        ? "bg-neutral-800 text-white dark:bg-white/10 dark:text-white border border-transparent" 
                                                        : "bg-transparent text-neutral-500 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent"
                                                    }`}
                                                >
                                                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: g.color }} />
                                                    {g.name}
                                                </button>
                                            ))}
                                            <button onClick={() => setIsCreateGroupOpen(true)} className="cursor-pointer px-2 py-1 rounded-md text-xs text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 border border-dashed border-neutral-400/30 flex items-center gap-1">
                                                <Plus size={12} /> New
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tags Property */}
                                    <div className={`flex ${isFocusMode ? 'flex-col gap-2' : 'items-start gap-4'}`}>
                                        <div className={`${isFocusMode ? 'w-full' : 'w-24 shrink-0 mt-1.5'} flex items-center gap-2 text-neutral-400 text-xs font-medium`}>
                                            <Hash size={14} /> Tags
                                        </div>
                                        <div className="w-full flex-1 flex flex-wrap gap-1.5 items-center">
                                            {editTags.map((tag) => (
                                                <span key={tag} onClick={() => removeTag(tag)} className="group flex items-center gap-1 px-2 py-1 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-md text-xs cursor-pointer hover:bg-red-500/10 hover:text-red-400 transition-colors">
                                                    {tag} <X size={10} className="opacity-0 group-hover:opacity-100" />
                                                </span>
                                            ))}
                                            <input 
                                                value={newTag}
                                                onChange={(e) => setNewTag(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                                onBlur={addTag}
                                                placeholder="Add tag..."
                                                className="bg-black/5 dark:bg-white/5 rounded-md px-2 py-1 outline-none text-xs text-neutral-600 dark:text-neutral-400 w-24 focus:w-full transition-all duration-300"
                                            />
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div layout className="mt-8 pt-8 border-t border-black/5 dark:border-white/5">
                                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <LinkIcon size={14} /> Backlinks ({nodeConnections.length})
                                </h4>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                    {nodeConnections.map((connId: any, index: number) => {
                                        const connNode = allNodes.nodes.find((n: any) => (typeof n.id === 'string' ? n.id : n.id?.id) === connId);
                                        const connLabel = connNode ? (connNode.title ?? connNode.content ?? connId) : connId;
                                        return (
                                            <div key={connId + index} className="group flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl hover:border-indigo-500/30 transition-all cursor-pointer">
                                                <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate pr-2">{connLabel}</span>
                                                <button onClick={(e) => { e.stopPropagation(); onDeleteLink(selectedNode.id, connId); }} className="cursor-pointer opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-400 transition-opacity">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Smart Connection Search */}
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={connectionSearch}
                                        onChange={(e) => {
                                            setConnectionSearch(e.target.value);
                                            setIsConnListOpen(true);
                                        }}
                                        onFocus={() => setIsConnListOpen(true)}
                                        placeholder="Type to link another node..."
                                        className="w-full bg-transparent border-b border-dashed border-neutral-300 dark:border-neutral-700 py-2 text-sm text-neutral-700 dark:text-neutral-300 outline-none focus:border-indigo-500 transition-colors"
                                    />
                                    
                                    <AnimatePresence>
                                        {isConnListOpen && connectionSearch && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                                className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-48 overflow-y-auto"
                                            >
                                                {allNodes.nodes
                                                    .filter(n => {
                                                        const nodeId = typeof n.id === 'string' ? n.id : n.id?.id;
                                                        const matchesSearch = (n.title ?? n.content ?? '').toLowerCase().includes(connectionSearch.toLowerCase());
                                                        return nodeId !== selectedNode.id && !nodeConnections.includes(nodeId) && matchesSearch;
                                                    })
                                                    .map(node => (
                                                        <button
                                                            key={node.id}
                                                            onClick={() => {
                                                                onAddLink(selectedNode.id, node.id);
                                                                setConnectionSearch("");
                                                                setIsConnListOpen(false);
                                                            }}
                                                            className="cursor-pointer w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 text-sm text-neutral-700 dark:text-neutral-200 border-b border-black/5 dark:border-white/5 last:border-none"
                                                        >
                                                            {node.title || node.content}
                                                        </button>
                                                    ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>

                            </div>

                            <div className={`flex flex-col gap-4 flex-1 ${isFocusMode ? 'max-w-3xl min-w-0' : 'w-full'}`}>
                                {/* TITLE */}
                                <textarea
                                    ref={titleTextareaRef}
                                    value={editTitle}
                                    onChange={(e) => {
                                        setEditTitle(e.target.value);
                                        e.target.style.height = '0px';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                    className={`w-full bg-transparent font-bold scrollbar-hide text-neutral-900 dark:text-white outline-none border-none p-0 resize-none placeholder-neutral-300 dark:placeholder-neutral-800 overflow-hidden transition-colors ${
                                        isFocusMode ? "text-4xl md:text-5xl leading-tight py-2" : "text-2xl leading-snug tracking-tight py-1"
                                    }`}
                                    placeholder="Untitled Node"
                                    rows={1}
                                />

                                {isEditingContent ? (
                                    <textarea
                                        autoFocus
                                        value={editContent}
                                        onChange={(e) => {
                                            setEditContent(e.target.value);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        onBlur={() => setIsEditingContent(false)} // Ховаємо редактор, коли клікнули повз
                                        className={`w-full h-full min-h-[80vh] bg-transparent text-neutral-800 dark:text-neutral-300 leading-relaxed outline-none border-none p-0 resize-none placeholder-neutral-300 dark:placeholder-neutral-700 font-mono transition-all duration-300 ${
                                            isFocusMode ? "text-lg" : "text-sm"
                                        }`}
                                        placeholder="Start typing in markdown..."
                                    />
                                ) : (
                                    <div 
                                        onClick={() => setIsEditingContent(true)}
                                        className={`w-full min-h-[40vh] cursor-text prose prose-neutral dark:prose-invert max-w-none ${
                                            isFocusMode ? "prose-lg" : "prose-sm"
                                        } prose-headings:font-bold prose-a:text-indigo-500 hover:prose-a:text-indigo-400 [&>*:first-child]:mt-0`}
                                    >
                                        {editContent ? (
                                            <ReactMarkdown>{editContent}</ReactMarkdown>
                                        ) : (
                                            <span className="text-neutral-400 dark:text-neutral-600 italic">
                                                Start typing or use markdown...
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* AI ASSISTANT FOOTER — Також розчиняється для єдиного стилю */}
                    <motion.div 
                        animate={{ 
                            opacity: isTransitioning ? 0 : 1,
                            filter: isTransitioning ? "blur(4px)" : "blur(0px)" 
                        }}
                        transition={{ duration: 0.15 }}
                        className="p-4 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-3"
                    >
                        <div className="flex items-center gap-2">
                            {/* Головна кнопка AI (займає залишковий простір - flex-1) */}
                            {canUseNeuralCore ? (
                                <button 
                                    onClick={handleAskExocortex}
                                    disabled={isAiLoading}
                                    className="cursor-pointer w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 text-sm font-medium transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isAiLoading ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Sparkles size={16} className="group-hover:animate-pulse" />
                                    )}
                                    {isAiLoading ? "Analyzing neural patterns..." : "Ask Exocortex about this node"}
                                </button>
                            ) : (
                                <button 
                                    type="button"
                                    onClick={() => onRequestUpgrade?.("singularity")}
                                    className="cursor-pointer w-full flex items-center justify-center gap-2 py-3 bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-500 dark:text-neutral-400 text-sm font-medium transition-all hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 hover:text-neutral-700 dark:hover:text-neutral-300"
                                >
                                    <Lock size={16} />
                                    Ask Exocortex — Unlock with Singularity
                                </button>
                            )}

                            {/* Блок з додатковими діями */}
                            <div className="flex items-center gap-1 pl-2 border-l border-black/10 dark:border-white/10">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        const id = typeof selectedNode.id === "string" ? selectedNode.id : selectedNode.id?.id;
                                        if (id) onLocateNode?.(id);
                                    }}
                                    className="cursor-pointer p-2.5 text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all"
                                    title="Locate in Graph"
                                >
                                    <LocateFixed size={16} />
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        const id = typeof selectedNode.id === "string" ? selectedNode.id : selectedNode.id?.id;
                                        if (id) onDeepFocus?.(id);
                                    }}
                                    className="cursor-pointer p-2.5 text-neutral-500 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-500/10 rounded-xl transition-all"
                                    title="Deep Focus"
                                >
                                    <Sun size={16} />
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        const id = typeof selectedNode.id === "string" ? selectedNode.id : selectedNode.id?.id;
                                        if (id) onZenMode?.(id);
                                    }}
                                    className="cursor-pointer p-2.5 text-neutral-500 hover:text-purple-500 dark:hover:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-all"
                                    title="Zen Mode"
                                >
                                    <EyeIcon size={16} />
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        const id = typeof selectedNode.id === "string" ? selectedNode.id : selectedNode.id?.id;
                                        if (id) {
                                            onDelete?.(id);
                                            onClose();
                                        }
                                    }}
                                    className="cursor-pointer p-2.5 text-neutral-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                    title="Delete Node"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* AI response (only shown when Singularity and after a reply) */}
                        <AnimatePresence>
                            {canUseNeuralCore && aiResponse && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="relative p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 mt-1">
                                        <button 
                                            onClick={() => setAiResponse(null)}
                                            className="absolute top-2 right-2 p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                                        >
                                            <X size={14} />
                                        </button>
                                        
                                        <div className="text-sm text-neutral-700 dark:text-neutral-300 prose prose-sm dark:prose-invert prose-p:leading-relaxed max-w-none pr-4">
                                            <ReactMarkdown>{aiResponse}</ReactMarkdown>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                </motion.div>
            )}
            
            <CreateGroupModal
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