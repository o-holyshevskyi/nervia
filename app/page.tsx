/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import GraphNetwork from "@/src/components/GraphNetwork";
import Sidebar from "@/src/components/Sidebar";
import { useMemo, useState } from "react";
import { graphData as initialData, GraphLink } from "@/src/lib/dummyData";
import AddModal, { NodeData } from "@/src/components/AddModal";
import { Eye, PanelLeftOpen, Plus } from "lucide-react";
import LeftSidebar from "@/src/components/LeftSidebar";
import CommandPalette from "@/src/components/CommandPalette";
import ContextMenu from "@/src/components/ui/ContextMenu";
import PhysicsControl, { PhysicsConfig } from "@/src/components/PhysicsControl";


export default function Home() {
    const [data, setData] = useState(initialData);
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

    const handleAddNewThought = (nodeData: NodeData) => {
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
            fullData: nodeData,
            content: nodeData.content ?? ''
        };

        const newLinks: GraphLink[] = nodeData.connections.map(targetNodeId => ({
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

        setData({
            nodes: [...data.nodes, newNode],
            links: [...data.links, ...newLinks]
        });
    };

    const handleAddLink = (sourceId: string, targetId: string) => {
        if (sourceId === targetId) return; // Не можна з'єднувати самого з собою

        setData((prev: any) => {
            // Перевіряємо, чи такий зв'язок вже існує
            const exists = prev.links.some((l: any) => {
                const s = typeof l.source === 'object' ? l.source.id : l.source;
                const t = typeof l.target === 'object' ? l.target.id : l.target;
                return (s === sourceId && t === targetId) || (s === targetId && t === sourceId);
            });

            if (exists) return prev;

            return {
                ...prev,
                links: [...prev.links, { 
                    source: sourceId, 
                    target: targetId, 
                    relationType: 'manual', 
                    label: 'Manual connection' 
                }]
            };
        });
    };

    const handleUpdateNode = (nodeId: string, newData: { title?: string, content?: string, tags?: string[] }) => {
        setData((prev) => {
            const oldId = nodeId;
            const newId = newData.title ?? oldId;

            const newNodes = prev.nodes.map((node) => {
                if (node.id === oldId) {
                    return { 
                        ...node, 
                        x: node.x, y: node.y, vx: node.vx, vy: node.vy,
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
                    source: currentSourceId === oldId ? newId : currentSourceId, 
                    target: currentTargetId === oldId ? newId : currentTargetId 
                };
            });

            return { nodes: newNodes, links: newLinks };
        });
    };

    const handleDeleteNode = (nodeId: string) => {
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
    };

    const handleDeleteLink = (sourceId: string, targetId: string) => {
        setData((prev) => ({
            ...prev,
            links: prev.links.filter(l => {
                const s = typeof l.source === 'object' ? l.source.id : l.source;
                const t = typeof l.target === 'object' ? l.target.id : l.target;
                return !((s === sourceId && t === targetId) || (s === targetId && t === sourceId));
            })
        }));
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

            {!isLeftSidebarOpen && (
                <button
                    onClick={() => setIsLeftSidebarOpen(true)}
                    className="hover:cursor-pointer absolute top-32 left-20 z-10 -translate-x-1/2 flex items-center gap-2 px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-white/20 hover:scale-105 transition-all z-20 group"
                >
                    <PanelLeftOpen size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
            )}

            {zenModeNodeId && (
                <button
                    onClick={() => setZenModeNodeId(null)}
                    className="absolute top-24 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 bg-purple-500/20 backdrop-blur-md border border-purple-500/50 rounded-full text-purple-300 hover:bg-purple-500/40 hover:text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] animate-pulse"
                >
                    <Eye size={16} />
                    <span className="text-sm font-medium">Exit Zen Mode</span>
                </button>
            )}

            {activeTag !== null && (
                <button
                    onClick={() => {
                        setActiveTag(null);
                        setIsLeftSidebarOpen(false);
                    }}
                    className="absolute top-24 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 bg-purple-500/20 backdrop-blur-md border border-purple-500/50 rounded-full text-purple-300 hover:bg-purple-500/40 hover:text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] animate-pulse"
                >
                    <Eye size={16} />
                    <span className="text-sm font-medium">Clear Filter</span>
                </button>
            )}

            <ContextMenu
                isOpen={contextMenu.isOpen}
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
            />

            <CommandPalette 
                nodes={data.nodes} 
                onSelect={handleSearchSelect} 
            />

            <PhysicsControl 
                config={physicsConfig} 
                onChange={setPhysicsConfig} 
            />

            <button
                onClick={() => setIsAddModalOpen(true)}
                className="hover:cursor-pointer absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-white/20 hover:scale-105 transition-all z-20 group"
            >
                <Plus className="group-hover:rotate-90 transition-transform duration-300" size={24} />
                <span className="font-medium pr-2">New Neuron</span>
            </button>
        </main>
    );
}
