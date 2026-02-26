/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import GraphNetwork from "@/src/components/GraphNetwork";
import Sidebar from "@/src/components/Sidebar";
import { useMemo, useState } from "react";
import AddModal from "@/src/components/AddModal";
import { Eye, PanelLeftOpen, Plus, Loader2, Sparkles, X } from "lucide-react";
import LeftSidebar from "@/src/components/LeftSidebar";
import CommandPalette from "@/src/components/CommandPalette";
import ContextMenu from "@/src/components/ui/ContextMenu";
import PhysicsControl, { PhysicsConfig } from "@/src/components/PhysicsControl";
import { AnimatePresence, motion } from "framer-motion";
import { useGraphData } from "@/src/hooks/useGraphData";

export default function Home() {
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
    } = useGraphData();

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

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-neutral-950 flex-col gap-4">
                <Loader2 size={40} className="text-purple-500 animate-spin" />
                <p className="text-neutral-500 font-mono text-sm tracking-widest uppercase animate-pulse">Initializing Universe...</p>
            </div>
        );
    }
    
    return (
        <main className="flex min-h-screen flex-col items-center justify-between">
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
                onNodeContextMenu={handleNodeContextMenu}
                onBackgroundClick={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
            />
            <div className="absolute top-10 left-10 pointer-events-none">
                <h1 className="text-4xl font-bold text-white tracking-tighter">Synapse Bookmark</h1>
                <p className="text-neutral-400 mt-2">Your visual thoughts universe</p>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

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

            <LeftSidebar 
                isOpen={isLeftSidebarOpen}
                onClose={() => setIsLeftSidebarOpen(false)}
                tags={allTags} 
                activeTag={activeTag} 
                onTagSelect={setActiveTag}
                nodes={data.nodes}
                onSelect={handleSearchSelect}
                onImport={importData}
                onExport={exportData}
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
                onAdd={addNewNode}
                existingNodes={existingNodeIds}
                allTags={allTags}
            />

            <CommandPalette 
                nodes={data.nodes} 
                onSelect={handleSearchSelect} 
            />

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
