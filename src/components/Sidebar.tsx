/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import CloseButton from "./ui/CloseButton";
import { ChevronLeft, ChevronRight, Hash, Save, Plus, X, Globe, ExternalLink, LinkIcon, AlertCircle } from "lucide-react";

interface SidebarProps {
    selectedNode: any | null;
    onClose: () => void;
    onUpdateNode: (nodeId: string, newData: { title?: string, content?: string, tags?: string[], url?: string }) => void;
    allNodes: { nodes: any[], links: any[] };
    onDeleteLink: (sourceId: string, targetId: string) => void;
    onAddLink: (sourceId: string, targetId: string) => void;
}

export default function Sidebar({ selectedNode, allNodes, onClose, onUpdateNode, onAddLink, onDeleteLink }: SidebarProps) {
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

    const minWidth = 320;
    const maxWidth = typeof window !== 'undefined' ? window.innerWidth / 3 : 400;

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

    // Перевірка на "брудні" дані (включаючи теги)
    useEffect(() => {
        const titleChanged = editTitle !== selectedNode?.id;
        const contentChanged = editContent !== (selectedNode?.content || "");
        const tagsChanged = JSON.stringify(editTags) !== JSON.stringify(selectedNode?.tags || []);
        const urlChanged = editUrl !== (selectedNode?.url || "");
        
        setIsDirty(titleChanged || contentChanged || tagsChanged || urlChanged);
    }, [editContent, editTitle, editTags, selectedNode, editUrl]);

    useEffect(() => {
        if (selectedNode) {
            setEditTitle(selectedNode.id);
            setEditContent(selectedNode.content || "");
            setEditTags(selectedNode.tags || []);
            setEditUrl(selectedNode.url || "");
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

    const handleSave = () => {
        if (!selectedNode || !isDirty) return;

        const trimmedTitle = editTitle.trim();
        if (!trimmedTitle) {
            setError("Title cannot be empty.");
            return;
        }

        const originalId = typeof selectedNode.id === 'string' ? selectedNode.id : selectedNode.id?.id;

        if (trimmedTitle.toLowerCase() !== originalId.toLowerCase()) {
            const isDuplicate = allNodes.nodes.some((n: any) => {
                const nodeId = typeof n.id === 'string' ? n.id : n.id?.id;
                return nodeId.toLowerCase() === trimmedTitle.toLowerCase();
            });

            if (isDuplicate) {
                setError(`A neuron named "${trimmedTitle}" already exists.`);
                return;
            }
        }

        onUpdateNode(selectedNode.id, { 
            title: trimmedTitle, 
            content: editContent,
            tags: editTags,
            url: editUrl.trim()
        });
        
        reset();
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
                    initial={{ x: '100%', opacity: 0, width: minWidth }}
                    animate={{ 
                        x: 0, 
                        opacity: 1,
                        width: isExpanded ? maxWidth : minWidth
                    }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', duration: 0.8, delay: 0.1 }}
                    className="fixed top-0 right-0 h-full w-80 bg-neutral-950/80 backdrop-blur-2xl border-l border-white/10 p-8 shadow-2xl z-50 flex flex-col"
                >
                    {/* Header */}
                    <div className="flex flex-row items-center justify-between w-full mb-10 min-h-10">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="hover:cursor-pointer text-neutral-500 hover:text-white transition-colors"
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

                    <div className="flex-1 overflow-y-auto space-y-8  no-scrollbar">
                        <div className="space-y-2">
                            <textarea
                                value={editTitle}
                                onChange={(e) => {
                                    setEditTitle(e.target.value);
                                    if (error) setError(null);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                className="no-scrollbar w-full bg-transparent text-4xl font-bold text-white outline-none border-none p-0 resize-none placeholder-neutral-800 leading-tight"
                                placeholder="Node Name"
                                rows={2}
                            />

                            {selectedNode.type === 'link' && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl group focus-within:border-indigo-500/50 transition-all">
                                    <Globe size={14} className="text-neutral-600 group-focus-within:text-indigo-400" />
                                    <input 
                                        value={editUrl}
                                        onChange={(e) => setEditUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="bg-transparent outline-none text-xs text-neutral-400 w-full font-mono"
                                    />
                                    {editUrl && (
                                        <a href={editUrl.startsWith('http') ? editUrl : `https://${editUrl}`} target="_blank" className="text-neutral-600 hover:text-white">
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
                                className="no-scrollbar w-full bg-transparent text-neutral-400 text-base leading-relaxed outline-none border-none p-0 resize-none placeholder-neutral-800 min-h-[150px]"
                                placeholder="Start writing your thoughts here..."
                            />
                        </div>

                        {selectedNode.type === 'link' && (
                            <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 group relative transition-all hover:border-white/20">
                                {isLoadingPreview ? (
                                    <div className="h-48 w-full bg-white/5 animate-pulse flex flex-col items-center justify-center gap-3">
                                        <Globe className="text-indigo-500/50 animate-spin" size={24} />
                                        <span className="text-[10px] text-neutral-600 font-mono tracking-widest uppercase">Fetching data...</span>
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
                                            <div className="h-20 flex items-center justify-center bg-white/5 border-b border-white/5">
                                                <Globe size={20} className="text-neutral-700" />
                                            </div>
                                        )}
                                        
                                        <div className="p-5 space-y-3">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest truncate">
                                                    {previewData?.siteName || "Website"}
                                                </p>
                                                <h4 className="text-sm font-semibold text-white/90 leading-snug line-clamp-2">
                                                    {previewData?.title || editTitle}
                                                </h4>
                                            </div>

                                            <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3 font-light">
                                                {previewData?.description}
                                            </p>

                                            <a 
                                                href={editTitle.startsWith('http') ? editTitle : `https://${editTitle}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between w-full group/link pt-2"
                                            >
                                                <span className="text-[11px] text-neutral-500 group-hover/link:text-indigo-400 transition-colors flex items-center gap-2">
                                                    <ExternalLink size={12} />
                                                    Visit Source
                                                </span>
                                                <ChevronRight size={14} className="text-neutral-700 group-hover/link:text-indigo-400 group-hover/link:translate-x-1 transition-all" />
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
                                {editTags.map((tag) => (
                                    <span 
                                        key={tag} 
                                        className="group flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[11px] text-neutral-300 hover:border-red-500/50 hover:text-red-400 transition-all cursor-pointer"
                                        onClick={() => removeTag(tag)}
                                    >
                                        <Hash size={10} className="text-purple-500" />
                                        {tag}
                                        <X size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </span>
                                ))}
                                <div className="flex items-center gap-1 bg-transparent border border-dashed border-white/10 rounded-md px-2 py-1 focus-within:border-white/30 transition-all">
                                    <Plus size={10} className="text-neutral-600" />
                                    <input 
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                        placeholder="Add tag..."
                                        className="bg-transparent outline-none text-[11px] text-neutral-300 w-16 focus:w-24 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-6">
                                <div className="flex items-center justify-between text-xs text-neutral-500 font-mono uppercase tracking-widest border-b border-white/5 pb-2">
                                    <span>Connections</span>
                                    <span className="text-neutral-700">{nodeConnections.length}</span>
                                </div>

                                {/* Список існуючих зв'язків */}
                                <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                                    {nodeConnections.map((connId: any) => (
                                        <div key={connId} className="flex items-center justify-between group/conn p-2 rounded-xl hover:bg-white/5 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg text-neutral-500 group-hover/conn:text-indigo-400 transition-colors">
                                                    <LinkIcon size={14} />
                                                </div>
                                                <span className="text-sm text-neutral-400 group-hover/conn:text-white transition-colors">{connId}</span>
                                            </div>
                                            <button 
                                                onClick={() => onDeleteLink(selectedNode.id, connId)}
                                                className="opacity-0 group-hover/conn:opacity-100 p-2 text-neutral-600 hover:text-red-400 transition-all"
                                            >
                                                <X size={14} className="hover:cursor-pointer" />
                                            </button>
                                        </div>
                                    ))}
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
                                            className="w-full bg-white/5 border border-dashed border-white/10 rounded-xl p-3 text-xs text-neutral-400 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                                        />
                                        {connectionSearch && (
                                            <button 
                                                onClick={() => {setConnectionSearch(""); setIsConnListOpen(false);}}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white"
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
                                                className="absolute bottom-full left-0 w-full mb-2 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto no-scrollbar backdrop-blur-xl"
                                            >
                                                {allNodes.nodes
                                                    .filter(n => {
                                                        const nodeId = typeof n.id === 'string' ? n.id : n.id?.id;
                                                        const selectedId = typeof selectedNode.id === 'string' ? selectedNode.id : selectedNode.id?.id;
                                                        const matchesSearch = nodeId.toLowerCase().includes(connectionSearch.toLowerCase());
                                                        return nodeId !== selectedId && !nodeConnections.includes(nodeId) && matchesSearch;
                                                    })
                                                    .map((node) => {
                                                        const idStr = typeof node.id === 'string' ? node.id : node.id?.id;
                                                        return (
                                                            <button
                                                                key={idStr}
                                                                onClick={() => {
                                                                    onAddLink(selectedNode.id, idStr);
                                                                    setConnectionSearch("");
                                                                    setIsConnListOpen(false);
                                                                }}
                                                                className="hover:cursor-pointer w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors group border-b border-white/5 last:border-none"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-white/5 rounded-lg group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors text-neutral-500">
                                                                        <Plus size={14} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-white text-sm font-medium">{idStr}</p>
                                                                        {node.tags && node.tags.length > 0 && (
                                                                            <p className="text-[10px] text-neutral-500 mt-0.5">#{node.tags[0]}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <span className="text-[10px] font-bold text-neutral-600 group-hover:text-indigo-400 transition-colors uppercase tracking-widest">
                                                                    Connect +
                                                                </span>
                                                            </button>
                                                        );
                                                    })
                                                }
                                                {/* Якщо нічого не знайдено */}
                                                {allNodes.nodes.filter(n => {
                                                    const nodeId = typeof n.id === 'string' ? n.id : n.id?.id;
                                                    return nodeId.toLowerCase().includes(connectionSearch.toLowerCase());
                                                }).length === 0 && (
                                                    <div className="p-4 text-center text-xs text-neutral-600 italic">
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
                    <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-neutral-950 pointer-events-none z-10" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}