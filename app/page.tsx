/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import GraphNetwork from "@/src/components/GraphNetwork";
import Sidebar from "@/src/components/Sidebar";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import AddModal from "@/src/components/AddModal";
import { Eye, PanelLeftOpen, Plus, Loader2, Sparkles, X, Route, Sun, Settings2 } from "lucide-react";
import LeftSidebar from "@/src/components/LeftSidebar";
import CommandPalette from "@/src/components/CommandPalette";
import ContextMenu from "@/src/components/ui/ContextMenu";
import PhysicsControl, { PhysicsConfig } from "@/src/components/PhysicsControl";
import { AnimatePresence, motion } from "framer-motion";
import { useGraphData } from "@/src/hooks/useGraphData";
import { useAIProcessor } from "@/src/hooks/useAIProcessor";
import { useGroups } from "@/src/hooks/useGroups";
import { createClient } from "@/src/lib/supabase/client";
import AIStatusBar from "@/src/components/AIStatusBar";
import NeuralSearch from "@/src/components/NeuralSearch";
import PathfinderPanel from "@/src/components/PathfinderPanel";
import TimelinePanel from "@/src/components/TimelinePanel";
import UniverseHistory from "@/src/components/UniverseHistory";
import NeuralChat from "@/src/components/NeuralChat";
import OnboardingTour from "@/src/components/OnboardingTour";
import { useOnboarding } from "@/src/hooks/useOnboarding";
import { useNotifications } from "@/src/hooks/useNotifications";
import { toast } from "sonner";
import { playNotificationPlink } from "@/src/lib/notificationSound";
import { NeuralBackground } from "@/src/components/NeuralBackground";

export default function Home() {
    const supabase = useMemo(() => createClient(), []);
    const { hasCompletedOnboarding, isLoading: isOnboardingLoading, completeOnboarding } = useOnboarding(supabase);

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
        addLink,
        data.nodes
    );

    const { groups, addGroup: onAddGroup, deleteGroup: onDeleteGroup, refetch: refetchGroups } = useGroups(supabase);

    // When any node has a group_id not in our groups list (e.g. AI-created group on backend), refetch groups so the graph shows the real name
    const groupIds = useMemo(() => new Set(groups.map((g) => g.id)), [groups]);
    useEffect(() => {
        const hasMissingGroup = data.nodes.some((n: any) => {
            const gid = n?.group_id;
            return typeof gid === 'string' && gid.length > 0 && !groupIds.has(gid);
        });
        if (hasMissingGroup) refetchGroups();
    }, [data.nodes, groupIds, refetchGroups]);

    const handleNotificationInsert = useCallback((n: any) => {
        if (n?.type === "visit") {
            playNotificationPlink();
            const groupId = typeof n?.metadata?.group_id === "string" ? (n.metadata.group_id as string) : null;
            toast.custom(
                (t) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            filter: 'blur(0px)',
                            boxShadow: [
                                '0 0 22px rgba(6,182,212,0.18)',
                                '0 0 30px rgba(168,85,247,0.18)',
                                '0 0 22px rgba(6,182,212,0.18)',
                            ],
                            borderColor: [
                                'rgba(34,211,238,0.30)', // cyan-400/30-ish
                                'rgba(192,132,252,0.30)', // purple-400/30-ish
                                'rgba(34,211,238,0.30)',
                            ],
                        }}
                        transition={{
                            duration: 0.4,
                            ease: [0.16, 1, 0.3, 1],
                            boxShadow: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
                            borderColor: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
                        }}
                        className="rounded-xl bg-white/10 dark:bg-black/40 backdrop-blur-2xl border border-white/10 px-4 py-3 flex items-center justify-between gap-4 min-w-[300px]"
                        role="alert"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <motion.div
                                animate={{ rotate: [0, 2.5, -2.5, 0], y: [0, -0.5, 0.5, 0] }}
                                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                                className="shrink-0"
                                aria-hidden
                            >
                                <Sparkles size={18} className="text-cyan-400/80 dark:text-purple-300/80" />
                            </motion.div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
                                    Visit ping
                                </p>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                                    Your Universe is being explored! 🌌
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                if (groupId && typeof window !== "undefined") {
                                    window.dispatchEvent(
                                        new CustomEvent("synapse:navigate_to_group", { detail: { groupId } })
                                    );
                                }
                                toast.dismiss(t);
                            }}
                            className="cursor-pointer shrink-0 text-xs font-medium text-indigo-600 dark:text-purple-400 hover:underline"
                        >
                            View
                        </button>
                    </motion.div>
                ),
                { duration: 6000 }
            );
        }
    }, []);
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
    } = useNotifications(supabase, handleNotificationInsert);

    const handleNavigateToGroup = useCallback(
        (groupId: string) => {
            const node = data.nodes.find((n: any) => n.group_id === groupId);
            if (node) {
                const id = typeof node.id === "string" ? node.id : node.id?.id;
                if (id) setFlyToNodeId(id);
            }
        },
        [data.nodes]
    );

    const [selectedNode, setSelectedNode] = useState<any | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
    const [zenModeNodeId, setZenModeNodeId] = useState<string | null>(null);
    const [solarSystemNodeId, setSolarSystemNodeId] = useState<string | null>(null);
    const [physicsPanelOpen, setPhysicsPanelOpen] = useState(false);
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
    const [pathData, setPathData] = useState<{ nodes: string[]; links: any[] }>({ nodes: [], links: [] });
    const [isPathfinderOpen, setIsPathfinderOpen] = useState(false);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [contextNodeIds, setContextNodeIds] = useState<string[]>([]);
    const [clusterMode, setClusterMode] = useState<'group' | 'tag'>('group');

    // Deep-link from toast (and other UI) to a specific group_id.
    useEffect(() => {
        if (typeof window === "undefined") return;
        const handler = (evt: Event) => {
            const e = evt as CustomEvent<{ groupId?: string }>;
            const groupId = e?.detail?.groupId;
            if (!groupId) return;
            const node = data.nodes.find((n: any) => n.group_id === groupId);
            if (!node) return;
            const id = typeof node.id === "string" ? node.id : node.id?.id;
            if (id) {
                setFlyToNodeId(id);
                setIsLeftSidebarOpen(false);
            }
        };
        window.addEventListener("synapse:navigate_to_group", handler as EventListener);
        return () => window.removeEventListener("synapse:navigate_to_group", handler as EventListener);
    }, [data.nodes]);

    // Open sidebar when onboarding runs so step 4 (Neural Chat) target is visible.
    useEffect(() => {
        if (!hasCompletedOnboarding && !isOnboardingLoading) {
            setIsLeftSidebarOpen(true);
        }
    }, [hasCompletedOnboarding, isOnboardingLoading]);

    const { timelineMinDate, timelineMaxDate, timelineDatePoints } = useMemo(() => {
        const nodes = data.nodes;
        if (!nodes.length) {
            const now = Date.now();
            return { timelineMinDate: now, timelineMaxDate: now, timelineDatePoints: [] as number[] };
        }
        const withTimestamps = nodes.map((n: any, index: number) => {
            const raw = n.created_at ?? n.createdAt;
            const t = raw != null ? new Date(raw).getTime() : NaN;
            return Number.isFinite(t) ? t : null;
        });
        const valid = withTimestamps.filter((t): t is number => t !== null);
        const min = valid.length ? Math.min(...valid) : Date.now();
        const max = valid.length ? Math.max(...valid) : Date.now();
        if (valid.length < nodes.length) {
            const span = max - min || 1;
            withTimestamps.forEach((t, i) => {
                if (t === null) (withTimestamps as number[])[i] = min + (span * i) / nodes.length;
            });
        }
        const resolved = withTimestamps as number[];
        const datePoints = [...new Set(resolved)].sort((a, b) => a - b);
        const fallbackMin = datePoints[0] ?? Date.now();
        const fallbackMax = datePoints[datePoints.length - 1] ?? Date.now();
        return { timelineMinDate: fallbackMin, timelineMaxDate: fallbackMax, timelineDatePoints: datePoints };
    }, [data.nodes]);

    const [timelineDate, setTimelineDate] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackDurationSeconds, setPlaybackDurationSeconds] = useState(60);
    const timelineInitialized = useRef(false);
    useLayoutEffect(() => {
        if (data.nodes.length === 0) return;
        if (!timelineInitialized.current) {
            setTimelineDate(timelineMaxDate);
            timelineInitialized.current = true;
        }
    }, [data.nodes.length, timelineMaxDate]);

    const timelineDateRef = useRef(timelineDate);
    timelineDateRef.current = timelineDate;
    const playbackRafRef = useRef<number>(0);
    useEffect(() => {
        if (!isPlaying || data.nodes.length === 0 || timelineDatePoints.length === 0) return;
        const duration = playbackDurationSeconds * 1000;
        const start = Date.now();
        const points = timelineDatePoints;
        let startStep = points.findIndex((d) => d >= timelineDateRef.current);
        if (startStep < 0) startStep = points.length - 1;
        const endStep = points.length - 1;
        if (startStep >= endStep) {
            setIsPlaying(false);
            return;
        }
        const tick = () => {
            const elapsed = Date.now() - start;
            const t = Math.min(1, elapsed / duration);
            const step = startStep + t * (endStep - startStep);
            const idx = Math.round(step);
            setTimelineDate(points[Math.min(idx, endStep)]!);
            if (t < 1) {
                playbackRafRef.current = requestAnimationFrame(tick);
            } else {
                setIsPlaying(false);
            }
        };
        playbackRafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(playbackRafRef.current);
    }, [isPlaying, data.nodes.length, timelineDatePoints, playbackDurationSeconds]);

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

    const existingNodeTitlesForAI = useMemo(() => {
        return data.nodes.map((n: any) => (n.title ?? n.content ?? n.id)?.toString?.() ?? String(n.id));
    }, [data.nodes]);

    const handleAddWithAI = async (nodeData: any) => {
        setAddError(null);
        setAiTotal(1);
        setAiProgress(0);
        setIsAIProcessing(true);

        let createdNode: any;
        try {
            createdNode = await addNewNode(nodeData);
        } catch (e) {
            setAddError(e instanceof Error ? e.message : 'Failed to add neuron.');
            setIsAIProcessing(false);
            return;
        }
        if (!createdNode) {
            setIsAIProcessing(false);
            return;
        }

        if (nodeData.autoConnectAI) {
            try {
                const res = await fetch('/api/ai/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mode: 'suggest_connections',
                        newNode: { title: nodeData.title, content: nodeData.content, type: nodeData.type, url: nodeData.url },
                        existingNodes: existingNodeTitlesForAI
                    })
                });

                const aiResponse = await res.json();
                const groupId = typeof aiResponse.group_id === 'string' && aiResponse.group_id.length > 0 ? aiResponse.group_id : undefined;

                if (aiResponse.description && !nodeData.content) {
                    await updateNode(createdNode.id, {
                        content: aiResponse.description,
                        is_ai_processed: true,
                        ...(groupId !== undefined && { group_id: groupId }),
                    });
                } else if (groupId !== undefined) {
                    await updateNode(createdNode.id, { group_id: groupId });
                }

                if (Array.isArray(aiResponse.connections)) {
                    for (const connection of aiResponse.connections) {
                        const suggestedTitle = (connection.id ?? '').toString().trim();
                        if (!suggestedTitle || suggestedTitle === nodeData.title) continue;
                        const targetNode = data.nodes.find((n: any) => {
                            const t = (n.title ?? n.content ?? n.id)?.toString?.() ?? '';
                            return t.toLowerCase() === suggestedTitle.toLowerCase() || t.toLowerCase().includes(suggestedTitle.toLowerCase());
                        });
                        if (targetNode) {
                            const targetId = typeof targetNode.id === 'string' ? targetNode.id : targetNode.id?.id;
                            if (targetId && targetId !== createdNode.id) {
                                const aiLabel = `AI Similarity: ${connection.accuracy ?? 0}%`;
                                await addLink(createdNode.id, targetId, 'ai', aiLabel);
                            }
                        }
                    }
                }

                setAiProgress(1);

            } catch (err) {
                console.error("AI logic failed:", err);
                setIsAIProcessing(false);
            } finally {
                setTimeout(() => {
                    setIsAIProcessing(false);
                    setTimeout(() => {
                        setAiProgress(0);
                        setAiTotal(0);
                    }, 500);
                }, 2500);
            }
        } else {
            setIsAIProcessing(false);
        }
    };

    const handleImportWithQueue = async (bookmarks: any[]) => {
        console.log('Call -> handleImportWithQueue()');
        const insertedNodes = await importData(bookmarks);
        console.log('Nodes received for AI processing:', insertedNodes);

        if (insertedNodes && Array.isArray(insertedNodes) && insertedNodes.length > 0) {
            const allNodesForContext = [...data.nodes, ...insertedNodes];
            const MAX_NODES_PER_RUN = 25;
            for (let i = 0; i < insertedNodes.length; i += MAX_NODES_PER_RUN) {
                const batch = insertedNodes.slice(i, i + MAX_NODES_PER_RUN);
                // eslint-disable-next-line no-await-in-loop
                await processQueue(batch, allNodesForContext);
                // Small pause between batches to avoid bursts
                // eslint-disable-next-line no-await-in-loop
                await new Promise((r) => setTimeout(r, 1000));
            }
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
            if (e.key === "p" && (e.metaKey || e.ctrlKey) && e.altKey) {
                e.preventDefault();
                setIsPathfinderOpen(true);
            }
            if (e.key === "t" && (e.metaKey || e.ctrlKey) && e.altKey) {
                e.preventDefault();
                setIsTimelineOpen(true);
            }
            if (e.key === "h" && (e.metaKey || e.ctrlKey) && e.altKey) {
                e.preventDefault();
                setIsHistoryOpen(true);
            }
            if (e.key === "c" && (e.metaKey || e.ctrlKey) && e.altKey) {
                e.preventDefault();
                setIsChatOpen(true);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [openSearch]);

    const nodeIdsSet = useMemo(() => new Set(data.nodes.map((n: any) => typeof n.id === 'string' ? n.id : n.id?.id)), [data.nodes]);

    // When graph is empty or when referenced nodes no longer exist, clear node-related state to avoid "node not found" errors
    useEffect(() => {
        if (data.nodes.length === 0) {
            setSelectedNode(null);
            setFocusedNodeId(null);
            setZenModeNodeId(null);
            setSolarSystemNodeId(null);
            setFlyToNodeId(null);
            setHighlightedNodes([]);
            setPathData({ nodes: [], links: [] });
            return;
        }
        const stillExists = (id: string | null) => id != null && nodeIdsSet.has(id);
        setSelectedNode((prev: any) => {
            if (!prev) return null;
            const id = typeof prev.id === 'string' ? prev.id : prev.id?.id;
            return stillExists(id) ? prev : null;
        });
        setFocusedNodeId((prev) => (stillExists(prev) ? prev : null));
        setZenModeNodeId((prev) => (stillExists(prev) ? prev : null));
        setSolarSystemNodeId((prev) => (stillExists(prev) ? prev : null));
        setFlyToNodeId((prev) => (stillExists(prev) ? prev : null));
        setHighlightedNodes((prev) => prev.filter((id) => nodeIdsSet.has(id)));
        setPathData((prev) => ({
            nodes: prev.nodes.filter((id) => nodeIdsSet.has(id)),
            links: prev.links,
        }));
    }, [data.nodes.length, nodeIdsSet]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-neutral-950 flex-col gap-4">
                <Loader2 size={40} className="text-indigo-600 dark:text-purple-500 animate-spin" />
                <p className="text-neutral-500 dark:text-neutral-400 font-mono text-sm tracking-widest uppercase animate-pulse">Initializing Universe...</p>
            </div>
        );
    }
    
    return (
        <main className="bg-white dark:bg-neutral-950 flex min-h-screen flex-col items-center justify-between">
            <OnboardingTour run={!hasCompletedOnboarding && !isOnboardingLoading} onComplete={completeOnboarding} />
            <div className="absolute inset-0" data-tour-id="tour-graph" aria-hidden="true">
            <GraphNetwork 
                onNodeSelect={(node) => {
                    setSelectedNode(node);
                    setFocusedNodeId(typeof node.id === 'string' ? node.id : node.id?.id);
                }} 
                graphData={data}
                timelineDate={data.nodes.length > 0 && isTimelineOpen ? timelineDate : undefined}
                activeTag={activeTag}
                focusedNodeId={focusedNodeId}
                zenModeNodeId={zenModeNodeId}
                physicsConfig={physicsConfig}
                highlightedNodes={highlightedNodes}
                contextNodeIds={contextNodeIds}
                pathNodes={pathData.nodes}
                pathLinks={pathData.links}
                flyToNodeId={flyToNodeId}
                onFlyToComplete={() => setFlyToNodeId(null)}
                onNodeContextMenu={handleNodeContextMenu}
                onBackgroundClick={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
                solarSystemNodeId={solarSystemNodeId}
                clusterMode={clusterMode}
                groups={groups}
                renderToolbarExtra={(buttonClassName) => (
                    <button type="button" onClick={() => setPhysicsPanelOpen(true)} className={buttonClassName} title="Physics of the Universe" aria-label="Physics settings">
                        <Settings2 size={18} />
                    </button>
                )}
            />
            </div>
            <div className="absolute top-10 left-10 pointer-events-none" data-tour-id="tour-welcome">
                <div className="flex items-center gap-3">
                    <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg" aria-hidden>
                        <NeuralBackground clipPathId="neural-brain-clip-app-welcome" />
                    </span>
                    <h1 className="text-4xl font-bold text-neutral-900 dark:text-white tracking-tighter">Nervia</h1>
                </div>
                <p className="text-neutral-500 dark:text-neutral-400 mt-2">Your Visual Intelligence Universe</p>
            </div>

            <AnimatePresence>
                {!isLoading && data.nodes.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0, x: 0 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                            <div className="bg-black/5 dark:bg-neutral-900/60 backdrop-blur-xl border border-black/10 dark:border-white/10 p-10 rounded-3xl text-center max-w-md pointer-events-auto shadow-2xl flex flex-col items-center transform transition-all hover:border-black/20 dark:hover:border-white/20 hover:bg-black/10 dark:hover:bg-neutral-900/80">
                                <div className="w-16 h-16 bg-indigo-500/20 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/30 dark:border-purple-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)] dark:shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                                    <Sparkles className="text-indigo-600 dark:text-purple-400" size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3 tracking-tight">Nothing here yet</h2>
                                <p className="text-neutral-500 dark:text-neutral-400 mb-8 text-sm leading-relaxed">
                                    Start building your knowledge graph. Add a Source, Memory, or Impulse to create your first neural link.
                                </p>
                                <button
                                    data-tour-id="tour-new-neuron"
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="hover:cursor-pointer flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-500/20 dark:bg-purple-500/20 border border-indigo-500/40 dark:border-purple-500/40 text-indigo-700 dark:text-purple-300 hover:bg-indigo-500/30 dark:hover:bg-purple-500/30 hover:text-indigo-900 dark:hover:text-white font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.15)] dark:shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                                >
                                    <Plus size={18} />
                                    Create First Neuron
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isLeftSidebarOpen && (
                <button
                    type="button"
                    onClick={() => setIsLeftSidebarOpen(true)}
                    className="absolute top-30 left-8 z-20 w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-md bg-black/[0.05] border border-black/10 dark:bg-white/[0.03] dark:border-white/5 text-neutral-500 hover:bg-black/10 hover:text-black dark:text-neutral-500 dark:hover:bg-white/10 dark:hover:text-white transition-all duration-300 ease-out cursor-pointer"
                    aria-label="Open left sidebar"
                >
                    <PanelLeftOpen size={20} />
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
                            className="hover:cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-500/20 dark:bg-purple-500/20 backdrop-blur-md border border-indigo-500/50 dark:border-purple-500/50 rounded-full text-indigo-700 dark:text-purple-300 hover:bg-indigo-500/40 dark:hover:bg-purple-500/40 hover:text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] dark:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
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
                            className="hover:cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-500/20 backdrop-blur-md border border-indigo-500/50 rounded-full text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/40 hover:text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] dark:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                        >
                            <Eye size={14} className="opacity-70" />
                            <span className="text-sm font-medium">Exit Zen Mode</span>
                        </motion.button>
                    )}

                    {solarSystemNodeId !== null && (
                        <motion.button
                            initial={{ opacity: 0, y: -10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.9 }}
                            key={'deep-focus'}
                            onClick={() => setSolarSystemNodeId(null)}
                            className="hover:cursor-pointer flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur-md border border-amber-500/50 rounded-full text-amber-800 dark:text-amber-300 hover:bg-amber-500/40 hover:text-white shadow-[0_0_20px_rgba(245,158,11,0.25)] dark:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                        >
                            <Sun size={14} className="opacity-70" />
                            <span className="text-sm font-medium">Exit Deep Focus</span>
                            <X size={14} className="opacity-70" />
                        </motion.button>
                    )}

                    {highlightedNodes.length > 0 && (
                        <motion.button
                            initial={{ opacity: 0, y: -10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.9 }}
                            key={'clear-search'}
                            onClick={() => setHighlightedNodes([])}
                            className="hover:cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-500/20 dark:bg-purple-500/20 backdrop-blur-md border border-indigo-500/50 dark:border-purple-500/50 rounded-full text-indigo-700 dark:text-purple-300 hover:bg-indigo-500/40 dark:hover:bg-purple-500/40 hover:text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] dark:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                        >
                            <Sparkles size={14} className="opacity-70" />
                            <span className="text-sm font-medium">Clear search</span>
                            <X size={14} className="opacity-70" />
                        </motion.button>
                    )}

                    {pathData.nodes.length > 0 && (
                        <motion.button
                            initial={{ opacity: 0, y: -10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.9 }}
                            key={'clear-path'}
                            onClick={() => setPathData({ nodes: [], links: [] })}
                            className="hover:cursor-pointer flex items-center gap-2 px-4 py-2 bg-cyan-500/20 backdrop-blur-md border border-cyan-500/50 rounded-full text-cyan-800 dark:text-cyan-300 hover:bg-cyan-500/40 hover:text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] dark:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                        >
                            <Route size={14} className="opacity-70" />
                            <span className="text-sm font-medium">Clear Path</span>
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
                onDeepFocus={(nodeId) => setSolarSystemNodeId(nodeId)}
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
                label={isAIProcessing ? "Neural Core syncing" : "Batch Importing"} 
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

            <NeuralChat
                isOpen={isChatOpen}
                onClose={() => {
                    setIsChatOpen(false);
                    setContextNodeIds([]);
                }}
                nodes={data.nodes}
                isPremium={false}
                setContextNodeIds={setContextNodeIds}
            />

            {isPathfinderOpen && (
                <PathfinderPanel
                    nodes={data.nodes}
                    links={data.links}
                    onPathFound={(pathNodes, pathLinks) => setPathData({ nodes: pathNodes, links: pathLinks })}
                    onClose={() => {
                        setIsPathfinderOpen(false);
                        setPathData({ nodes: [], links: [] });
                    }}
                />
            )}

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
                onOpenPathfinder={() => setIsPathfinderOpen(true)}
                onOpenTimeline={() => setIsTimelineOpen(true)}
                onOpenHistory={() => setIsHistoryOpen(true)}
                onOpenChat={() => setIsChatOpen(true)}
                clusterMode={clusterMode}
                onClusterModeChange={setClusterMode}
                groups={groups}
                onAddGroup={onAddGroup}
                onDeleteGroup={onDeleteGroup}
                notifications={notifications}
                unreadCount={unreadCount}
                markAsRead={markAsRead}
                markAllAsRead={markAllAsRead}
                onNavigateToGroup={handleNavigateToGroup}
            />

            <Sidebar 
                selectedNode={selectedNode} 
                onClose={() => setSelectedNode(null)} 
                onUpdateNode={updateNode}
                allNodes={data}
                onAddLink={addLink}
                onDeleteLink={deleteLink}
                groups={groups}
                onAddGroup={onAddGroup}
            />

            <AddModal 
                isOpen={isAddModalOpen} 
                onClose={() => { setIsAddModalOpen(false); setAddError(null); }}
                onAdd={handleAddWithAI}
                existingNodes={data.nodes}
                allTags={allTags}
                submitError={addError}
            />

            <CommandPalette onOpenSearch={openSearch} />

            <PhysicsControl
                config={physicsConfig}
                onChange={setPhysicsConfig}
                open={physicsPanelOpen}
                onOpenChange={setPhysicsPanelOpen}
            />

            {isTimelineOpen && (
                <TimelinePanel
                    datePoints={timelineDatePoints}
                    currentDate={data.nodes.length > 0 ? timelineDate : timelineMaxDate}
                    onChange={setTimelineDate}
                    isPlaying={isPlaying}
                    onTogglePlay={() => setIsPlaying((p) => !p)}
                    playbackDurationSeconds={playbackDurationSeconds}
                    onPlaybackDurationChange={setPlaybackDurationSeconds}
                    onClose={() => {
                        setIsTimelineOpen(false);
                        setIsPlaying(false);
                        setTimelineDate(timelineMaxDate);
                    }}
                />
            )}

            {isHistoryOpen && (
                <UniverseHistory
                    nodes={data.nodes}
                    groups={groups}
                    supabase={supabase}
                    onClose={() => setIsHistoryOpen(false)}
                />
            )}

            {!isLoading && data.nodes.length > 0 && (
                <motion.button
                    type="button"
                    data-tour-id="tour-new-neuron"
                    onClick={() => setIsAddModalOpen(true)}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full backdrop-blur-2xl bg-white/90 dark:bg-neutral-900/50 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white font-medium tracking-wide flex items-center gap-2 shadow-[0_0_30px_rgba(168,85,247,0.15)] cursor-pointer z-20"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                    <Plus size={18} className="text-purple-400 shrink-0" />
                    <span>New Neuron</span>
                </motion.button>
            )}
        </main>
    );
}
