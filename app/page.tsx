/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import GraphNetwork from "@/src/components/GraphNetwork";
import Sidebar from "@/src/components/Sidebar";
import { useEffect, useMemo, useState } from "react";
import AddModal, { NodeData } from "@/src/components/AddModal";
import { Eye, PanelLeftOpen, Plus, Loader2, Sparkles, X } from "lucide-react";
import LeftSidebar from "@/src/components/LeftSidebar";
import CommandPalette from "@/src/components/CommandPalette";
import ContextMenu from "@/src/components/ui/ContextMenu";
import PhysicsControl, { PhysicsConfig } from "@/src/components/PhysicsControl";
import { supabase } from "@/src/lib/supabaseClient";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
    const [data, setData] = useState({ nodes: [] as any[], links: [] as any[] });
    const [isLoading, setIsLoading] = useState(true);
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

    useEffect(() => {
        const fetchGraphData = async () => {
            try {
                const { data: nodesData, error: nodesError } = await supabase.from('nodes').select('*');
                const { data: linksData, error: linksError } = await supabase.from('links').select('*');

                if (nodesError) throw nodesError;
                if (linksError) throw linksError;

                const formattedLinks = linksData.map(l => ({
                    ...l,
                    relationType: l.relation_type || 'manual'
                }));

                setData({ nodes: nodesData || [], links: formattedLinks || [] });
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGraphData();
    }, []);

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

    const handleAddNewThought = async (nodeData: NodeData) => {
        let group = 1;
        if (nodeData.type === 'link') group = 1;
        if (nodeData.type === 'note') group = 2;
        if (nodeData.type === 'idea') group = 3;

        const newNode = { 
            id: nodeData.title,
            group: group,
            val: 5,
            type: nodeData.type,
            tags: nodeData.tags,
            content: nodeData.content ?? '',
            full_data: nodeData
        };

        const newLinks: any[] = nodeData.connections.map(targetNodeId => ({
            source: nodeData.title,
            target: targetNodeId,
            relationType: 'manual',
            label: 'Manual connection',
            weight: 1
        }));

        if (nodeData.autoConnectAI && data.nodes.length > 0) {
            const availableNodes = data.nodes.filter((n: any) => {
                const nodeId = typeof n.id === 'string' ? n.id : n.id?.id;
                return !nodeData.connections.includes(nodeId);
            });

            if (availableNodes.length > 0) {
                const aiConnectionsCount = Math.floor(Math.random() * 2) + 1; 
                const shuffled = [...availableNodes].sort(() => 0.5 - Math.random());
                const selectedAiNodes = shuffled.slice(0, aiConnectionsCount);

                selectedAiNodes.forEach((aiNode: any) => {
                    const aiNodeId = typeof aiNode.id === 'string' ? aiNode.id : aiNode.id?.id;
                    const similarity = Math.floor(Math.random() * 24) + 75; 
                    newLinks.push({
                        source: nodeData.title,
                        target: aiNodeId,
                        relationType: 'ai',
                        label: `AI Generated (Similarity: ${similarity}%)`,
                        weight: 1
                    });
                });
            }
        }

        // Оптимістичне оновлення UI
        setData(prev => ({
            nodes: [...prev.nodes, newNode],
            links: [...prev.links, ...newLinks]
        }));

        const dbNode = {
            id: newNode.id,
            group: newNode.group,
            val: newNode.val,
            type: newNode.type,
            tags: newNode.tags,
            content: newNode.content,
            full_data: newNode.full_data
        };

        // 🔥 ВІДПРАВКА В SUPABASE З ОБРОБКОЮ ПОМИЛОК 🔥
        const { error: nodeError } = await supabase.from('nodes').insert(dbNode);
        
        if (nodeError) {
            console.error("🔴 Failed to save node:", nodeError.message, nodeError.details);
            
            // 🔥 РОБИМО ROLLBACK (ВІДКАТ) АНІМАЦІЇ ЗАМІСТЬ ALERT 🔥
            // Видаляємо ноду і лінки, які ми щойно оптимістично додали
            setData(prev => ({
                nodes: prev.nodes.filter(n => n.id !== newNode.id),
                links: prev.links.filter(l => 
                    (typeof l.source === 'object' ? l.source.id : l.source) !== newNode.id &&
                    (typeof l.target === 'object' ? l.target.id : l.target) !== newNode.id
                )
            }));
            
            return; // Зупиняємо виконання
        }
        
        if (newLinks.length > 0) {
            const dbLinks = newLinks.map(l => ({
                source: typeof l.source === 'object' ? l.source.id : l.source,
                target: typeof l.target === 'object' ? l.target.id : l.target,
                relation_type: l.relationType,
                label: l.label,
                weight: l.weight
            }));
            const { error: linkError } = await supabase.from('links').insert(dbLinks);
            
            if (linkError) {
                console.error("🔴 Failed to save links:", linkError.message);
            }
        }
    };

    const handleAddLink = async (sourceId: string, targetId: string) => {
        if (sourceId === targetId) return; 

        const newLink = { 
            source: sourceId, 
            target: targetId, 
            relationType: 'manual', 
            label: 'Manual connection' 
        };

        setData((prev: any) => {
            const exists = prev.links.some((l: any) => {
                const s = typeof l.source === 'object' ? l.source.id : l.source;
                const t = typeof l.target === 'object' ? l.target.id : l.target;
                return (s === sourceId && t === targetId) || (s === targetId && t === sourceId);
            });
            if (exists) return prev;
            return { ...prev, links: [...prev.links, newLink] };
        });

        // Відправка в Supabase
        await supabase.from('links').insert({
            source: typeof sourceId === 'object' ? (sourceId as any).id : sourceId,
            target: typeof targetId === 'object' ? (targetId as any).id : targetId,
            relation_type: 'manual',
            label: 'Manual connection'
        });
    };

    const handleUpdateNode = async (nodeId: string, newData: { title?: string, content?: string, tags?: string[] }) => {
        const newId = newData.title ?? nodeId;

        // Оптимістичне оновлення
        setData((prev) => {
            const newNodes = prev.nodes.map((node) => {
                if (node.id === nodeId) {
                    return { 
                        ...node, 
                        id: newId, 
                        content: newData.content ?? node.content,
                        tags: newData.tags ?? node.tags
                    };
                }
                return node;
            });

            const newLinks = prev.links.map((link) => {
                const currentSourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const currentTargetId = typeof link.target === 'object' ? link.target.id : link.target;
                return { 
                    ...link, 
                    source: currentSourceId === nodeId ? newId : currentSourceId, 
                    target: currentTargetId === nodeId ? newId : currentTargetId 
                };
            });

            return { nodes: newNodes, links: newLinks };
        });

        // Відправка в Supabase
        // Якщо ID змінилося, треба бути обережним (залежить від ON UPDATE CASCADE в БД)
        // Для початку ми просто оновлюємо вміст і теги
        await supabase.from('nodes')
            .update({
                id: newId,
                content: newData.content,
                tags: newData.tags
            })
            .eq('id', nodeId);
    };

    const handleDeleteNode = async (nodeId: string) => {
        setData((prevData) => {
            const newNodes = prevData.nodes.filter(
                (n: any) => (typeof n.id === 'string' ? n.id : n.id?.id) !== nodeId
            );
            const newLinks = prevData.links.filter((l: any) => {
                const sourceId = typeof l.source === 'string' ? l.source : l.source?.id;
                const targetId = typeof l.target === 'string' ? l.target : l.target?.id;
                return sourceId !== nodeId && targetId !== nodeId;
            });
            return { nodes: newNodes, links: newLinks };
        });

        if (selectedNode && (typeof selectedNode.id === 'string' ? selectedNode.id : selectedNode.id?.id) === nodeId) {
            setSelectedNode(null);
        }

        // Supabase видалить пов'язані лінки автоматично завдяки ON DELETE CASCADE
        await supabase.from('nodes').delete().eq('id', nodeId);
    };

    const handleDeleteLink = async (sourceId: string, targetId: string) => {
        setData((prev) => ({
            ...prev,
            links: prev.links.filter(l => {
                const s = typeof l.source === 'object' ? l.source.id : l.source;
                const t = typeof l.target === 'object' ? l.target.id : l.target;
                return !((s === sourceId && t === targetId) || (s === targetId && t === sourceId));
            })
        }));

        // Видаляємо з БД. Шукаємо лінк незалежно від напрямку
        await supabase.from('links').delete().or(`and(source.eq.${sourceId},target.eq.${targetId}),and(source.eq.${targetId},target.eq.${sourceId})`);
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

            {!isLoading && data.nodes.length === 0 && (
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
            )}

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
                onDelete={handleDeleteNode}
            />

            <LeftSidebar 
                isOpen={isLeftSidebarOpen}
                onClose={() => setIsLeftSidebarOpen(false)}
                tags={allTags} 
                activeTag={activeTag} 
                onTagSelect={setActiveTag}
                nodes={data.nodes}
                onSelect={handleSearchSelect}
            />

            <Sidebar 
                selectedNode={selectedNode} 
                onClose={() => setSelectedNode(null)} 
                onUpdateNode={handleUpdateNode}
                allNodes={data}
                onAddLink={handleAddLink}
                onDeleteLink={handleDeleteLink}
            />

            <AddModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddNewThought}
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
