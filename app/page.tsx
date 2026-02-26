/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import GraphNetwork from "@/src/components/GraphNetwork";
import Sidebar from "@/src/components/Sidebar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AddModal from "@/src/components/AddModal";
import { Eye, PanelLeftOpen, Plus, Loader2, Sparkles, X } from "lucide-react";
import LeftSidebar from "@/src/components/LeftSidebar";
import CommandPalette from "@/src/components/CommandPalette";
import ContextMenu from "@/src/components/ui/ContextMenu";
import PhysicsControl, { PhysicsConfig } from "@/src/components/PhysicsControl";
import { AnimatePresence, motion } from "framer-motion";
import { useGraphData } from "@/src/hooks/useGraphData";
import { useAIProcessor } from "@/src/hooks/useAIProcessor";
import { createClient } from "@/src/lib/supabase/client";
import AIStatusBar from "@/src/components/AIStatusBar";
import NeuralSearch from "@/src/components/NeuralSearch";

export default function Home() {
    const supabase = useMemo(() => createClient(), []);
    
    const { 
        data, 
        isLoading,
        addNewNode,
        updateNode,
        deleteNode,
        addLink,
        deleteLink,
        importData,
        exportData,
    } = useGraphData(supabase);

    const { isProcessing, progress, total, failed, processQueue } = useAIProcessor(
        supabase, 
        updateNode, 
        addLink
    );

    const [selectedNode, setSelectedNode] = useState<any | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
    const [zenModeNodeId, setZenModeNodeId] = useState<string | null>(null);
    const [physicsConfig, setPhysicsConfig] = useState<PhysicsConfig>({
        repulsion: 150,
        linkDistance: 60
    });
    const [isAIProcessing, setIsAIProcessing] = useState(false);
    const [aiProgress, setAiProgress] = useState(0);
    const [aiTotal, setAiTotal] = useState(0);
    const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [flyToNodeId, setFlyToNodeId] = useState<string | null>(null);
    const searchFocusRef = useRef<(() => void) | null>(null);

    const [contextMenu, setContextMenu] = useState({
        isOpen: false,
        x: 0,
        y: 0,
        node: null as any | null
    });

    const allTags = useMemo(() => {
        const tagsSet = new Set<string>();
        data.nodes.forEach((node: any) => {
            if (node.tags) node.tags.forEach((tag: string) => tagsSet.add(tag));
        });
        return Array.from(tagsSet);
    }, [data]);

    const toggleZenMode = (nodeId: string) => {
        if (zenModeNodeId === nodeId) {
            setZenModeNodeId(null);
        } else {
            setZenModeNodeId(nodeId);
            setFocusedNodeId(nodeId);
        }
    };

    const handleNodeContextMenu = (node: any, event: MouseEvent) => {
        setContextMenu({
            isOpen: true,
            x: event.clientX,
            y: event.clientY,
            node: node
        });
    };

    const existingNodeIds = useMemo(() => {
        return data.nodes.map((n: any) => typeof n.id === 'string' ? n.id : n.id?.id || n.id);
    }, [data.nodes]);

    const handleSearchSelect = (node: any) => {
        const idStr = typeof node.id === 'string' ? node.id : node.id?.id;
        setFocusedNodeId(idStr);
        setSelectedNode(node);
    };

    const handleSearchResultSelect = useCallback((node: any) => {
        const idStr = typeof node.id === 'string' ? node.id : node.id?.id;
        setIsSearchOpen(false);
        setFlyToNodeId(idStr);
    }, []);

    const handleAddWithAI = async (nodeData: any) => {
        setAiTotal(1);
        setAiProgress(0);
        setIsAIProcessing(true);

        await addNewNode(nodeData);

        if (nodeData.autoConnectAI) {
            try {
                const res = await fetch('/api/ai/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        mode: 'suggest_connections', 
                        newNode: { title: nodeData.title, content: nodeData.content, type: nodeData.type, url: nodeData.url },
                        existingNodes: existingNodeIds 
                    })
                });

                const aiResponse = await res.json();
                const validGroup = typeof aiResponse.group === 'number' && aiResponse.group >= 1 && aiResponse.group <= 5 ? aiResponse.group : undefined;

                if (aiResponse.description && !nodeData.content) {
                    await updateNode(nodeData.title, {
                        ...nodeData,
                        content: aiResponse.description,
                        is_ai_processed: true,
                        ...(validGroup !== undefined && { group: validGroup }),
                    });
                } else if (validGroup !== undefined) {
                    await updateNode(nodeData.title, { group: validGroup });
                }

                if (Array.isArray(aiResponse.connections)) {
                    for (const connection of aiResponse.connections) {
                        if (connection.id !== nodeData.title) {
                            const aiLabel = `AI Similarity: ${connection.accuracy}%`;
                            await addLink(nodeData.title, connection.id, 'ai', aiLabel);
                        }
                    }
                }

                // Встановлюємо прогрес на 100% (1 з 1)
                setAiProgress(1);

            } catch (err) {
                console.error("AI logic failed:", err);
                setIsAIProcessing(false);
            } finally {
                // 🔥 Чекаємо 2.5 секунди, щоб користувач насолодився статусом "Done"
                setTimeout(() => {
                    setIsAIProcessing(false);
                    // Скидаємо цифри трохи пізніше, коли анімація закриття завершиться
                    setTimeout(() => {
                        setAiProgress(0);
                        setAiTotal(0);
                    }, 500);
                }, 2500);
            }
        } else {
            // Якщо AI вимкнено, просто закриваємо бар
            setIsAIProcessing(false);
        }
    };

    const handleImportWithQueue = async (bookmarks: any[]) => {
        console.log('Call -> handleImportWithQueue()');
        const insertedNodes = await importData(bookmarks);
        console.log('Nodes received for AI processing:', insertedNodes);

        if (insertedNodes && Array.isArray(insertedNodes) && insertedNodes.length > 0) {
            const toLine = (n: any) => {
                const id = typeof n.id === 'string' ? n.id : n.id?.id;
                const url = (n.url || '').slice(0, 120);
                return url ? `${id} | ${url}` : id;
            };
            const existingLines = data.nodes.map(toLine);
            const insertedLines = insertedNodes.map((n: any) => toLine(n));
            const allWithContext = [...existingLines, ...insertedLines];
            processQueue(insertedNodes, allWithContext);
        } else {
            console.log('No nodes to process (either duplicates or error)');
        }
    };

    const openSearch = useCallback(() => {
        setIsSearchOpen(true);
        setTimeout(() => searchFocusRef.current?.(), 100);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "k" && e.ctrlKey && e.altKey) {
                e.preventDefault();
                openSearch();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [openSearch]);

    useEffect(() => {
        // Чекаємо, поки завантажаться основні дані нод
        if (!isLoading && data.nodes.length > 0 && !isProcessing) {
            
            // Знаходимо ноди, які ще не обробив ШІ
            const pendingNodes = data.nodes.filter((n: any) => n.is_ai_processed === false);

            if (pendingNodes.length > 0) {
                console.log(`🚀 Found ${pendingNodes.length} unprocessed nodes. Resuming AI sync...`);
                
                const allExistingIds = data.nodes.map((n: any) => 
                    typeof n.id === 'string' ? n.id : n.id?.id
                );

                // Запускаємо чергу автоматично
                processQueue(pendingNodes, allExistingIds);
            }
        }
    }, [isLoading, data.nodes.length]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-neutral-950 flex-col gap-4">
                <Loader2 size={40} className="text-purple-500 animate-spin" />
                <p className="text-neutral-500 font-mono text-sm tracking-widest uppercase animate-pulse">Initializing Universe...</p>
            </div>
        );
    }
    
    return (
        <main className="bg-red flex min-h-screen flex-col items-center justify-between">
            <GraphNetwork 
                onNodeSelect={(node) => {
                    setSelectedNode(node);
                    setFocusedNodeId(typeof node.id === 'string' ? node.id : node.id?.id);
                }} 
                graphData={data}
                activeTag={activeTag}
                focusedNodeId={focusedNodeId}
                zenModeNodeId={zenModeNodeId}
                physicsConfig={physicsConfig}
                highlightedNodes={highlightedNodes}
                flyToNodeId={flyToNodeId}
                onFlyToComplete={() => setFlyToNodeId(null)}
                onNodeContextMenu={handleNodeContextMenu}
                onBackgroundClick={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
            />
            <div className="absolute top-10 left-10 pointer-events-none">
                <h1 className="text-4xl font-bold text-white tracking-tighter">Synapse Bookmark</h1>
                <p className="text-neutral-400 mt-2">Your visual thoughts universe</p>
            </div>

            <AnimatePresence>
                {!isLoading && data.nodes.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0, x: 0 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                            <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 p-10 rounded-3xl text-center max-w-md pointer-events-auto shadow-2xl flex flex-col items-center transform transition-all hover:border-white/20 hover:bg-neutral-900/80">
                                <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                                    <Sparkles className="text-purple-400" size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Nothing here yet</h2>
                                <p className="text-neutral-400 mb-8 text-sm leading-relaxed">
                                    Start building your knowledge graph. Add a note, idea, or link to create your first connection.
                                </p>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="hover:cursor-pointer flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] hover:-translate-y-1"
                                >
                                    <Plus size={18} />
                                    Create First Node
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isLeftSidebarOpen && (
                <button
                    onClick={() => setIsLeftSidebarOpen(true)}
                    className="hover:cursor-pointer absolute top-32 left-20 z-10 -translate-x-1/2 flex items-center gap-2 px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-white/20 hover:scale-105 transition-all z-20 group"
                >
                    <PanelLeftOpen size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
            )}

            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
                <AnimatePresence>
                    {activeTag !== null && (
                        <motion.button
                            initial={{ opacity: 0, y: -10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.9 }}
                            key={'clear-filter'}
                            onClick={() => {
                                setActiveTag(null);
                                setIsLeftSidebarOpen(false);
                            }}
                            className="hover:cursor-pointer flex items-center gap-2 px-4 py-2 bg-purple-500/20 backdrop-blur-md border border-purple-500/50 rounded-full text-purple-300 hover:bg-purple-500/40 hover:text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                        >
                            <span className="text-sm font-medium">Clear Filter: {activeTag}</span>
                            <X size={14} className="opacity-70" />
                        </motion.button>
                    )}

                    {zenModeNodeId !== null && (
                        <motion.button
                            initial={{ opacity: 0, y: -10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.9 }}
                            key={'zen-mode'}
                            onClick={() => setZenModeNodeId(null)}
                            className="hover:cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-500/20 backdrop-blur-md border border-indigo-500/50 rounded-full text-indigo-300 hover:bg-indigo-500/40 hover:text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                        >
                            <Eye size={14} className="opacity-70" />
                            <span className="text-sm font-medium">Exit Zen Mode</span>
                        </motion.button>
                    )}

                    {highlightedNodes.length > 0 && (
                        <motion.button
                            initial={{ opacity: 0, y: -10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.9 }}
                            key={'clear-search'}
                            onClick={() => setHighlightedNodes([])}
                            className="hover:cursor-pointer flex items-center gap-2 px-4 py-2 bg-purple-500/20 backdrop-blur-md border border-purple-500/50 rounded-full text-purple-300 hover:bg-purple-500/40 hover:text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                        >
                            <Sparkles size={14} className="opacity-70" />
                            <span className="text-sm font-medium">Clear search</span>
                            <X size={14} className="opacity-70" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            <ContextMenu
                isOpen={contextMenu.isOpen}
                isActiveTag={activeTag !== null}
                x={contextMenu.x}
                y={contextMenu.y}
                node={contextMenu.node}
                isZenModeActive={zenModeNodeId !== null}
                onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
                onFocus={(nodeId) => {
                    setFocusedNodeId(nodeId);
                }}
                onZenMode={toggleZenMode}
                onEdit={(node) => {
                    setSelectedNode(node);
                }}
                onDelete={deleteNode}
            />

            <AIStatusBar 
                isVisible={isProcessing || isAIProcessing} 
                current={isAIProcessing ? aiProgress : progress} 
                failed={isAIProcessing ? 0 : failed}
                total={isAIProcessing ? aiTotal : total}
                label={isAIProcessing ? "Neural Syncing" : "Batch Importing"} 
            />

            <NeuralSearch
                nodes={data.nodes}
                onResultSelect={handleSearchResultSelect}
                onSearchChange={setHighlightedNodes}
                isOpen={isSearchOpen}
                onClose={() => {
                    setIsSearchOpen(false);
                    setHighlightedNodes([]);
                }}
                onOpenRef={searchFocusRef}
            />

            <LeftSidebar 
                isOpen={isLeftSidebarOpen}
                onClose={() => setIsLeftSidebarOpen(false)}
                tags={allTags} 
                activeTag={activeTag} 
                onTagSelect={setActiveTag}
                nodes={data.nodes}
                onSelect={handleSearchSelect}
                onImport={handleImportWithQueue}
                onExport={exportData}
                onOpenSearch={openSearch}
            />

            <Sidebar 
                selectedNode={selectedNode} 
                onClose={() => setSelectedNode(null)} 
                onUpdateNode={updateNode}
                allNodes={data}
                onAddLink={addLink}
                onDeleteLink={deleteLink}
            />

            <AddModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddWithAI}
                existingNodes={existingNodeIds}
                allTags={allTags}
            />

            <CommandPalette onOpenSearch={openSearch} />

            <PhysicsControl 
                config={physicsConfig} 
                onChange={setPhysicsConfig} 
            />

            {!isLoading && data.nodes.length > 0 && ( 
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="hover:cursor-pointer absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-white/20 hover:scale-105 transition-all z-20 group"
                >
                    <Plus className="group-hover:rotate-90 transition-transform duration-300" size={24} />
                    <span className="font-medium pr-2">New Neuron</span>
                </button>
            )}
        </main>
    );
}
