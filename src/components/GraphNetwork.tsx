/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { forceManyBody, forceX, forceY, forceRadial, forceCollide } from 'd3-force';
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Lightbulb, LinkIcon, Sparkles, ZoomIn, ZoomOut, Locate, Box, Lock, Orbit, Boxes } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import GraphNetwork2D from './GraphNetwork2D';
import GraphNetwork3D from './GraphNetwork3D';

const imgCache: { [key: string]: HTMLImageElement } = {};
const iconCache: Record<string, HTMLImageElement> = {};

const groupColors: Record<number, string> = {
    1: "#64748b",
    2: "#10b981",
    3: "#6366f1",
    4: "#f97316",
    5: "#06b6d4",
};
const groupNames: Record<number, string> = {
    1: "No Group",
    2: "No Group",
    3: "Finance",
    4: "Design",
    5: "Research",
};

const loadingLabels = [
    "Connecting to Exocortex",
    "Calculating Gravity",
    "Mapping Neural Paths",
    "Stabilizing Universe",
    "Ready",
    "Connection Stable",
    "Synchronized",
];

function hashStr(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return (h % 1e6) / 1e6;
}

function getNodeGroup(node: any): number {
    if (node.group != null) {
        const g = typeof node.group === 'number' ? node.group : Number(node.group);
        if (Number.isFinite(g)) return g;
    }
    if (node.type === 'note') return 2;
    if (node.type === 'idea') return 3;
    return 1;
}

function getNodeGroupKey(node: any): string | number {
    if (node.group_id != null && typeof node.group_id === 'string') return node.group_id;
    return getNodeGroup(node);
}

function looksLikeId(s: string, idStr: string): boolean {
    if (!s || s === idStr) return true;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) return true;
    if (s.length >= 32 && /^[0-9a-f-]+$/i.test(s)) return true;
    return false;
}

function getNodeLabel(node: any): string {
    const idStr = typeof node.id === 'string' ? node.id : node?.id != null ? String(node.id) : '';
    const title = (node.title ?? '').toString().trim();
    const content = (node.content ?? '').toString().trim();
    if (title && !looksLikeId(title, idStr)) return title;
    if (content && !looksLikeId(content, idStr)) return content;
    return 'Untitled';
}

function getGraphThemeColors(container: HTMLElement | null): { nodeColor: string; linkColor: string; graphBg: string } {
    const el = container ?? (typeof document !== 'undefined' ? document.documentElement : null);
    if (!el) return { nodeColor: '#1f2937', linkColor: 'rgba(55, 65, 81, 0.5)', graphBg: '#f9fafb' };
    const style = getComputedStyle(el);
    return {
        nodeColor: style.getPropertyValue('--node-color').trim() || '#1f2937',
        linkColor: style.getPropertyValue('--link-color').trim() || 'rgba(55, 65, 81, 0.5)',
        graphBg: style.getPropertyValue('--graph-bg').trim() || '#f9fafb',
    };
}

function hexToRgba(hex: string, alpha: number): string {
    if (!hex.startsWith('#')) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

const ACCENT_INDIGO = "#6366f1";
const ACCENT_PURPLE = "#a855f7";
function isDarkTheme(): boolean {
    return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}
function accentHex(): string { return isDarkTheme() ? ACCENT_PURPLE : ACCENT_INDIGO; }
function accentRgba(alpha: number): string {
    return isDarkTheme() ? `rgba(168, 85, 247, ${alpha})` : `rgba(99, 102, 241, ${alpha})`;
}

function getGroupColor(key: string | number, groupColorsById: Record<string, string>): string | undefined {
    if (typeof key === 'string') return groupColorsById[key];
    return groupColors[key];
}

function getGroupLabel(key: string | number, groupNamesById: Record<string, string>): string {
    if (typeof key === 'string') {
        const name = groupNamesById[key];
        if (name) return name;
        if (key.length >= 32 && /^[0-9a-f-]+$/i.test(key)) return 'New group';
        return key;
    }
    return groupNames[key] ?? `Group ${key}`;
}

const createIconImage = (IconComponent: any, color: string, strokeWidth: number = 2.5) => {
    const cacheKey = `${IconComponent.displayName}-${color}`;
    if (iconCache[cacheKey]) return iconCache[cacheKey];
    const svgString = renderToStaticMarkup(<IconComponent color={color} size={32} strokeWidth={strokeWidth} />);
    const img = new Image();
    img.src = `data:image/svg+xml;base64,${btoa(svgString)}`;
    iconCache[cacheKey] = img;
    return img;
};

export interface GraphGroup {
    id: string;
    name: string;
    color: string;
    description?: string;
}

interface GraphNetworkProps {
    graphData: { nodes: any[]; links: any[] };
    timelineDate?: number;
    activeTag: string | null;
    focusedNodeId: string | null;
    zenModeNodeId: string | null;
    physicsConfig: { repulsion: number; linkDistance: number };
    highlightedNodes?: string[];
    contextNodeIds?: string[];
    pathNodes?: string[];
    pathLinks?: any[];
    flyToNodeId?: string | null;
    onFlyToComplete?: () => void;
    solarSystemNodeId?: string | null;
    clusterMode?: 'group' | 'tag';
    groups?: GraphGroup[];
    onNodeSelect: (node: any) => void;
    onNodeContextMenu?: (node: any, event: MouseEvent) => void;
    onBackgroundClick?: () => void;
    readOnly?: boolean;
    renderToolbarExtra?: (buttonClassName: string) => React.ReactNode;
    canUse3DGraph?: boolean;
    onRequest3DUpgrade?: () => void;
    viewMode?: '2D' | '3D';
    onViewModeChange?: (mode: '2D' | '3D') => void;
    onLinkContextMenu?: (link: any, event: MouseEvent) => void;
}

function getLinkEnd(linkEnd: any): string | undefined {
    return typeof linkEnd === "string" ? linkEnd : linkEnd?.id;
}

function buildClusterCenters2D(
    nodes: any[],
    clusterMode: 'group' | 'tag',
    layoutRadius: number
): Record<string | number, { x: number; y: number }> {
    const getClusterKey = (n: any): string | number =>
        clusterMode === 'group'
            ? getNodeGroupKey(n)
            : (n.tags && n.tags.length > 0 ? n.tags[0] : 'untagged') as string;
    const rawKeys = [...new Set(nodes.map(getClusterKey))];
    const uniqueKeys = rawKeys.sort((a, b) => String(a).localeCompare(String(b)));
    const centers: Record<string | number, { x: number; y: number }> = {};
    uniqueKeys.forEach((key, i) => {
        const angle = (i * 2 * Math.PI) / Math.max(1, uniqueKeys.length);
        centers[key] = {
            x: layoutRadius * Math.cos(angle),
            y: layoutRadius * Math.sin(angle),
        };
    });
    return centers;
}

export default function GraphNetwork({
    onNodeSelect,
    onBackgroundClick,
    onNodeContextMenu,
    graphData,
    timelineDate,
    activeTag,
    focusedNodeId,
    zenModeNodeId,
    physicsConfig,
    highlightedNodes = [],
    contextNodeIds = [],
    pathNodes = [],
    pathLinks = [],
    flyToNodeId = null,
    onFlyToComplete,
    solarSystemNodeId = null,
    clusterMode = 'group',
    groups = [],
    readOnly = false,
    viewMode = '2D',
}: GraphNetworkProps) {
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [isInitialFitting, setIsInitialFitting] = useState(true);
    const [loadingStep, setLoadingStep] = useState(0);

    const engineIsDone = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const fgRef = useRef<any>(null);
    const fg3dRef = useRef<any>(null);
    const physicsAppliedRef = useRef(false);
    const zoomScheduledRef = useRef(false);
    const clusterCentersRef = useRef<Record<string | number, { x: number; y: number }>>({});

    const initialFitDone = useRef(false);
    const threeDKeyRef = useRef(0);
    const [engineReadyCount, setEngineReadyCount] = useState(0);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

    useEffect(() => {
        if (!isInitialFitting) return;
        const interval = setInterval(() => {
            setLoadingStep((prev) => {
                if (engineIsDone.current) return prev;
                if (prev >= 3) return prev;
                return prev + 1;
            });
        }, 1200);
        const hardTimeout = setTimeout(() => {
            if (!engineIsDone.current) {
                engineIsDone.current = true;
                initialFitDone.current = true;
                physicsAppliedRef.current = true;
                fgRef.current?.zoomToFit(450, 100);
                setLoadingStep(4);
                setTimeout(() => setLoadingStep(5), 220);
                setTimeout(() => setLoadingStep(6), 440);
                setTimeout(() => setIsInitialFitting(false), 650);
            }
        }, 1500);
        return () => { clearInterval(interval); clearTimeout(hardTimeout); };
    }, [isInitialFitting]);

    const handleEngineStop = useCallback(() => {
        setEngineReadyCount((c) => Math.max(c, 1));
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && engineIsDone.current && isInitialFitting) {
                setIsInitialFitting(false);
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [isInitialFitting]);

    useEffect(() => {
        if (viewMode !== '2D') return;
        const t = setTimeout(() => setEngineReadyCount((c) => Math.max(c, 1)), 50);
        return () => clearTimeout(t);
    }, [viewMode]);

    const groupColorsById = useMemo(() => {
        const out: Record<string, string> = {};
        for (const g of groups) out[g.id] = g.color;
        return out;
    }, [groups]);
    const groupNamesById = useMemo(() => {
        const out: Record<string, string> = {};
        for (const g of groups) out[g.id] = g.name;
        return out;
    }, [groups]);
    const groupDescriptionsById = useMemo(() => {
        const out: Record<string, string> = {};
        for (const g of groups) if (g.description) out[g.id] = g.description;
        return out;
    }, [groups]);

    const [hoveredLink, setHoveredLink] = useState<any | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const zenModeNeighbors = useMemo(() => {
        const neighbors = new Set<string>();
        if (zenModeNodeId) {
            neighbors.add(zenModeNodeId);
            graphData.links.forEach((link: any) => {
                const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
                const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
                if (sourceId === zenModeNodeId) neighbors.add(targetId);
                if (targetId === zenModeNodeId) neighbors.add(sourceId);
            });
        }
        return neighbors;
    }, [zenModeNodeId, graphData.links]);

    const solarNeighbors = useMemo(() => {
        const neighbors = new Set<string>();
        if (solarSystemNodeId) {
            neighbors.add(solarSystemNodeId);
            graphData.links.forEach((link: any) => {
                const sourceId = typeof link.source === 'string' ? link.source : link.source?.id;
                const targetId = typeof link.target === 'string' ? link.target : link.target?.id;
                if (sourceId === solarSystemNodeId) neighbors.add(targetId);
                if (targetId === solarSystemNodeId) neighbors.add(sourceId);
            });
        }
        return neighbors;
    }, [solarSystemNodeId, graphData.links]);

    const nodeIdToGroupKeyMap = useMemo(() => {
        const m = new Map<string | number, string | number>();
        graphData.nodes.forEach((n: any) => {
            const id = typeof n.id === 'string' ? n.id : n?.id;
            if (id != null) m.set(id, getNodeGroupKey(n));
        });
        return m;
    }, [graphData.nodes]);

    const highlightedSet = useMemo(() => new Set(highlightedNodes), [highlightedNodes]);
    const contextNodeSet = useMemo(() => new Set(contextNodeIds), [contextNodeIds]);
    const searchActive = highlightedSet.size > 0;
    const pathfinderActive = pathNodes.length > 0;
    const pathNodeSet = useMemo(() => new Set(pathNodes), [pathNodes]);

    const pathLinkSet = useMemo(() => {
        const set = new Set<string>();
        const linkKey = (a: string, b: string) => (a < b ? `${a}\0${b}` : `${b}\0${a}`);
        pathLinks.forEach((link: any) => {
            const sId = typeof link.source === "string" ? link.source : link.source?.id;
            const tId = typeof link.target === "string" ? link.target : link.target?.id;
            if (sId != null && tId != null) set.add(linkKey(sId, tId));
        });
        return set;
    }, [pathLinks]);

    const isPathLink = useCallback((link: any) => {
        const sId = typeof link.source === "string" ? link.source : link.source?.id;
        const tId = typeof link.target === "string" ? link.target : link.target?.id;
        if (sId == null || tId == null) return false;
        const key = sId < tId ? `${sId}\0${tId}` : `${tId}\0${sId}`;
        return pathLinkSet.has(key);
    }, [pathLinkSet]);

    const processedData = useMemo(() => {
        const { nodes, links } = graphData;
        const getNodeId = (n: any) => (typeof n === 'string' ? n : n?.id);
        const useTimeline = typeof timelineDate === 'number' && Number.isFinite(timelineDate);

        // 1. БАЗОВА ФІЛЬТРАЦІЯ (Таймлайн)
        let workingNodes = nodes;
        let workingLinks = links;

        if (useTimeline) {
            const filteredNodes = nodes.filter(
                (n: any) => new Date(n.created_at ?? n.createdAt ?? 0).getTime() <= timelineDate!
            );
            const filteredNodeIds = new Set(
                filteredNodes.map((n: any) => getNodeId(n)).filter((id): id is string => id != null)
            );
            workingNodes = filteredNodes;
            workingLinks = links.filter((l: any) => {
                const sId = getLinkEnd(l.source);
                const tId = getLinkEnd(l.target);
                return sId != null && tId != null && filteredNodeIds.has(sId) && filteredNodeIds.has(tId);
            });
        }

        // Якщо увімкнено пошук або шляхи — скасовуємо Мета-граф, показуємо все як є
        if (searchActive || pathfinderActive) {
            return { nodes: workingNodes, links: workingLinks };
        }

        // 2. АГРЕГАЦІЯ (Макро-рівень / Галактика)
        if (activeGroupId === null) {
            const metaNodesMap = new Map();
            const metaLinksMap = new Map();

            workingNodes.forEach((n: any) => {
                const gId = getNodeGroupKey(n);
                const gName = getGroupLabel(gId, groupNamesById);
                
                // Сироти (No Group) залишаються звичайними дрібними нодами
                if (gId === 1 || gId === 2 || gName === 'No Group') {
                    metaNodesMap.set(n.id, { ...n, val: 6 }); // Даємо їм базовий розмір
                    return;
                }

                // Створюємо Мета-ноду (Планету), якщо її ще немає
                if (!metaNodesMap.has(gId)) {
                    metaNodesMap.set(gId, {
                        id: `meta-${gId}`,
                        isMetaNode: true,
                        groupId: gId,
                        title: gName,
                        val: 25, // Початковий радіус
                        originalNodesCount: 0
                    });
                }
                
                // Нарощуємо масу планети залежно від кількості нод у ній
                const metaNode = metaNodesMap.get(gId);
                metaNode.originalNodesCount += 1;
                metaNode.val = Math.min(90, 25 + metaNode.originalNodesCount * 1.5); 
            });

            // Агрегуємо лінки між Мета-нодами
            workingLinks.forEach((l: any) => {
                const sId = getLinkEnd(l.source);
                const tId = getLinkEnd(l.target);
                const sNode = workingNodes.find((n: any) => getNodeId(n) === sId);
                const tNode = workingNodes.find((n: any) => getNodeId(n) === tId);
                if (!sNode || !tNode) return;

                const sGid = getNodeGroupKey(sNode);
                const tGid = getNodeGroupKey(tNode);
                const sName = getGroupLabel(sGid, groupNamesById);
                const tName = getGroupLabel(tGid, groupNamesById);

                const sKey = (sGid === 1 || sGid === 2 || sName === 'No Group') ? getNodeId(sNode) : `meta-${sGid}`;
                const tKey = (tGid === 1 || tGid === 2 || tName === 'No Group') ? getNodeId(tNode) : `meta-${tGid}`;

                if (sKey !== tKey) {
                    const linkKey = sKey < tKey ? `${sKey}-${tKey}` : `${tKey}-${sKey}`;
                    if (!metaLinksMap.has(linkKey)) {
                        metaLinksMap.set(linkKey, {
                            source: sKey,
                            target: tKey,
                            isMetaLink: true,
                            weight: 1
                        });
                    } else {
                        metaLinksMap.get(linkKey).weight += 0.2; // Потовщуємо лінк
                    }
                }
            });

            return { 
                nodes: Array.from(metaNodesMap.values()), 
                links: Array.from(metaLinksMap.values()) 
            };
        } 
        
        // 3. МІКРО-РІВЕНЬ (Користувач зайшов у кластер)
        const coreNodes = workingNodes.filter((n: any) => getNodeGroupKey(n) === activeGroupId);
        const coreNodeIds = new Set(coreNodes.map(getNodeId));
        
        const validLinks = workingLinks.filter((l: any) => {
            const sId = getLinkEnd(l.source);
            const tId = getLinkEnd(l.target);
            // ЗМІНА ТУТ: АБО замість І
            return coreNodeIds.has(sId) || coreNodeIds.has(tId); 
        });

        // Розраховуємо вагу кожної ноди всередині кластера для фізики
        const neighborIds = new Set();
        validLinks.forEach((l: any) => {
            const sId = getLinkEnd(l.source);
            const tId = getLinkEnd(l.target);
            if (!coreNodeIds.has(sId)) neighborIds.add(sId);
            if (!coreNodeIds.has(tId)) neighborIds.add(tId);
        });

        const neighborNodes = workingNodes.filter((n: any) => neighborIds.has(getNodeId(n)));
        const allClusterNodes = [...coreNodes, ...neighborNodes];

        const degreeMap: Record<string, number> = {};
        validLinks.forEach((link: any) => {
            const sId = getLinkEnd(link.source);
            const tId = getLinkEnd(link.target);
            if (sId != null) degreeMap[sId] = (degreeMap[sId] ?? 0) + 1;
            if (tId != null && tId !== sId) degreeMap[tId] = (degreeMap[tId] ?? 0) + 1;
        });

        const nodesWithVal = allClusterNodes.map((node: any) => {
            const id = getNodeId(node);
            const degree = degreeMap[id] ?? 0;
            const isExternal = !coreNodeIds.has(id); 
            return { 
                ...node, 
                val: Math.min(4 + degree * 1.5, 20),
                isExternalNeighbor: isExternal 
            };
        });

        const cleanLinks = validLinks.map((l: any) => ({
            ...l,
            source: getLinkEnd(l.source),
            target: getLinkEnd(l.target)
        }));

        return { nodes: nodesWithVal, links: cleanLinks };
    }, [graphData, searchActive, highlightedSet, pathfinderActive, pathNodes, timelineDate, activeGroupId, groupNamesById]);

    const getNodeIconUrl = useCallback((node: any) => {
        if (node.type === 'link' && node.url) {
            try {
                const domain = new URL(node.url).hostname;
                return `/api/favicon?domain=${domain}`;
            } catch { return null; }
        }
        return null;
    }, []);

    const isLinkHidden = useCallback((link: any) => {
        const sId = typeof link.source === 'string' ? link.source : link.source?.id;
        const tId = typeof link.target === 'string' ? link.target : link.target?.id;
        if (solarSystemNodeId) {
            if (!solarNeighbors.has(sId) && !solarNeighbors.has(tId)) return true;
            return false;
        }
        if (pathfinderActive) return !isPathLink(link);
        if (searchActive) {
            if (!highlightedSet.has(sId) && !highlightedSet.has(tId)) return true;
        }
        if (zenModeNodeId && sId !== zenModeNodeId && tId !== zenModeNodeId) return true;
        if (activeTag) {
            const sTags = typeof link.source === 'object' ? link.source.tags : graphData.nodes.find((n: any) => n.id === sId)?.tags;
            const tTags = typeof link.target === 'object' ? link.target.tags : graphData.nodes.find((n: any) => n.id === tId)?.tags;
            if (!sTags?.includes(activeTag) || !tTags?.includes(activeTag)) return true;
        }
        return false;
    }, [solarSystemNodeId, solarNeighbors, pathfinderActive, isPathLink, searchActive, highlightedSet, zenModeNodeId, activeTag, graphData.nodes]);

    const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const x = Number(node.x);
        const y = Number(node.y);
        if (!isFinite(x) || !isFinite(y)) return;

        if (node.isMetaNode) {
            const color = getGroupColor(node.groupId, groupColorsById) ?? "#ec4899";
            const radius = node.val; 

            // Світлова аура
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, hexToRgba(color, 0.4)); 
            gradient.addColorStop(1, hexToRgba(color, 0.05));
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Оболонка планети
            ctx.strokeStyle = color;
            ctx.lineWidth = 3 / globalScale;
            ctx.stroke();

            // Текст (Назва кластера + кількість)
            const fontSize = Math.max(14 / globalScale, 4); 
            if (fontSize < 30) { 
                ctx.font = `bold ${fontSize}px Inter, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = isDarkTheme() ? '#ffffff' : '#171717';
                ctx.fillText(node.title, x, y - radius / 4);
                
                ctx.font = `500 ${fontSize * 0.65}px Inter, sans-serif`;
                ctx.fillStyle = isDarkTheme() ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
                ctx.fillText(`${node.originalNodesCount} neurons`, x, y + radius / 3);
            }
            return; // ЗУПИНЯЄМО РЕНДЕР: далі йде код для звичайних нод, він нам тут не потрібен
        }

        const themeColors = getGraphThemeColors(containerRef.current);
        const idStr = typeof node.id === 'string' ? node.id : node.id?.id;
        const label = getNodeLabel(node);
        const rawSize = (node.val ?? 4) * 1;
        let size = Math.min(20, Math.max(6, rawSize));

        let isHidden = false;
        let baseColor: string;
        let strongGlow = false;
        if (solarSystemNodeId) {
            if (!solarNeighbors.has(idStr)) {
                isHidden = true;
                baseColor = "rgba(10, 10, 10, 0.05)";
            } else if (idStr === solarSystemNodeId) {
                baseColor = "#eab308";
                size = Math.min(28, size * 1.3);
                strongGlow = true;
            } else {
                const groupKey = nodeIdToGroupKeyMap.get(idStr) ?? getNodeGroupKey(node);
                baseColor = getGroupColor(groupKey, groupColorsById) ?? groupColors[typeof groupKey === 'number' ? groupKey : 1] ?? "#06b6d4";
                strongGlow = true;
            }
        } else {
            const isPathNode = pathfinderActive && pathNodeSet.has(idStr);
            const pathStartId = pathNodes[0];
            const pathEndId = pathNodes.length > 0 ? pathNodes[pathNodes.length - 1] : null;
            const isPathStart = idStr === pathStartId;
            const isPathEnd = pathEndId != null && idStr === pathEndId;
            const isSearchHighlighted = !pathfinderActive && searchActive && highlightedSet.has(idStr);
            if (searchActive && !pathfinderActive) { if (isSearchHighlighted) size = Math.min(24, size * 1.2); }
            if (pathfinderActive && isPathNode) size = Math.min(24, size * 1.2);
            const isZenHidden = !pathfinderActive && !searchActive && zenModeNodeId && !zenModeNeighbors.has(idStr);
            const isTagHidden = !pathfinderActive && !searchActive && activeTag && (!node.tags || !node.tags.includes(activeTag));
            const isDimmedBySearch = !pathfinderActive && searchActive && !isSearchHighlighted;
            const isDimmedByPath = pathfinderActive && !isPathNode;
            isHidden = isZenHidden || isTagHidden || isDimmedBySearch || isDimmedByPath;
            if (pathfinderActive) {
                if (isPathStart) baseColor = "#06b6d4";
                else if (isPathEnd) baseColor = "#f97316";
                else if (isPathNode) baseColor = "#06b6d4";
                else baseColor = themeColors.nodeColor.startsWith('#') ? hexToRgba(themeColors.nodeColor, 0.12) : themeColors.nodeColor;
            } else {
                const groupKey = nodeIdToGroupKeyMap.get(idStr) ?? getNodeGroupKey(node);
                baseColor = isSearchHighlighted ? accentHex() : (getGroupColor(groupKey, groupColorsById) ?? groupColors[typeof groupKey === 'number' ? groupKey : 1] ?? "#ec4899");
            }
            strongGlow = (searchActive && highlightedSet.has(idStr)) || (pathfinderActive && pathNodeSet.has(idStr));
        }

        const strokeColor = isHidden
            ? (themeColors.nodeColor.startsWith('#') ? hexToRgba(themeColors.nodeColor, 0.12) : themeColors.nodeColor)
            : baseColor;

        const isContextNode = contextNodeSet.has(idStr);
        if (isContextNode) {
            const t = Date.now() / 500;
            const pulse = 0.35 + 0.25 * Math.sin(t);
            const haloRadius = size * 2.2;
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, haloRadius, 0, 2 * Math.PI);
            ctx.strokeStyle = `rgba(6, 182, 212, ${pulse * 0.9})`;
            ctx.lineWidth = 3 / globalScale;
            ctx.shadowColor = accentRgba(0.8);
            ctx.shadowBlur = 20 / globalScale;
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(x, y, haloRadius + 2 / globalScale, 0, 2 * Math.PI);
            ctx.strokeStyle = accentRgba(pulse * 0.5);
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
            ctx.restore();
        }

        if (node.isNew && node.newPingAt) {
            const elapsed = Date.now() - (node.newPingAt as number);
            const duration = 4000;
            const alpha = Math.max(0, 1 - elapsed / duration);
            if (alpha > 0) {
                ctx.save();
                const pingRadius = size * 2.5;
                ctx.beginPath();
                ctx.arc(x, y, pingRadius, 0, 2 * Math.PI);
                const gradient = ctx.createRadialGradient(x, y, size, x, y, pingRadius);
                gradient.addColorStop(0, accentRgba(alpha * 0.5));
                gradient.addColorStop(0.6, accentRgba(alpha * 0.2));
                gradient.addColorStop(1, accentRgba(0));
                ctx.fillStyle = gradient;
                ctx.fill();
                ctx.restore();
            }
        }

        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI, false);
        const innerFill = isHidden ? 'rgba(0, 0, 0, 0)' : (themeColors.nodeColor.startsWith('#') ? hexToRgba(themeColors.nodeColor, 0.18) : 'rgba(0, 0, 0, 0.2)');
        ctx.fillStyle = innerFill;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strongGlow ? 2.5 / globalScale : 2 / globalScale;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = strongGlow ? 18 / globalScale : 10 / globalScale;
        ctx.stroke();

        if (!isHidden) {
            const iconUrl = getNodeIconUrl(node);
            const iconSize = size * 1.2;
            if (iconUrl) {
                if (!imgCache[iconUrl]) {
                    const img = new Image();
                    img.src = iconUrl;
                    img.onload = () => { imgCache[iconUrl] = img; };
                } else {
                    const img = imgCache[iconUrl];
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(x, y, size * 0.8, 0, Math.PI * 2, true);
                    ctx.clip();
                    ctx.drawImage(img, x - iconSize/2, y - iconSize/2, iconSize, iconSize);
                    ctx.restore();
                }
            } else {
                let iconImg = null;
                if (node.type === 'idea') iconImg = createIconImage(Lightbulb, baseColor);
                else if (node.type === 'note') iconImg = createIconImage(FileText, baseColor);
                if (iconImg && iconImg.complete) {
                    ctx.save();
                    ctx.shadowColor = baseColor;
                    ctx.shadowBlur = 8 / globalScale;
                    ctx.drawImage(iconImg, x - iconSize / 2, y - iconSize / 2, iconSize, iconSize);
                    ctx.restore();
                }
            }
        }

        if (globalScale > 1.5) {
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = isHidden
                ? (themeColors.nodeColor.startsWith('#') ? hexToRgba(themeColors.nodeColor, 0.08) : 'rgba(255,255,255,0.05)')
                : themeColors.nodeColor;
            ctx.fillText(label, x, y + size + 4);
        }
    }, [solarSystemNodeId, solarNeighbors, pathfinderActive, pathNodeSet, pathNodes, searchActive, highlightedSet, contextNodeSet, zenModeNodeId, activeTag, zenModeNeighbors, getNodeIconUrl, nodeIdToGroupKeyMap, groupColorsById]);

    const handleRenderFramePre = useCallback(
        (ctx: CanvasRenderingContext2D, globalScale: number) => {
            if (solarSystemNodeId) return;
            // drawGroupAreas(ctx, processedData.nodes, dimensions, globalScale, nodeIdToGroupKeyMap, clusterMode, containerRef.current, groupColorsById, groupNamesById);
        },
        [processedData.nodes, dimensions, nodeIdToGroupKeyMap, clusterMode, solarSystemNodeId, groupColorsById, groupNamesById]
    );

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({ width: containerRef.current.offsetWidth, height: window.innerHeight });
        }
    }, []);

    useEffect(() => {
        if (viewMode !== '2D' || !fgRef.current) return;
        const fg = fgRef.current;

        // 0. Очищаємо всі кастомні координати, щоб фізика працювала з чистого аркуша
        processedData.nodes.forEach((node: any) => { 
            delete node.fx; 
            delete node.fy; 
        });

        fg.d3Force('center', null); // Центрування D3 нам не треба, ми керуємо камерою

        if (solarSystemNodeId && solarNeighbors.size > 0) {
            // === РЕЖИМ 1: СОНЯЧНА СИСТЕМА ===
            const getNodeIdStr = (node: any) => typeof node.id === 'string' ? node.id : node.id?.id;
            const centerNode = processedData.nodes.find((n: any) => getNodeIdStr(n) === solarSystemNodeId);
            
            if (centerNode) { 
                centerNode.fx = 0; 
                centerNode.fy = 0; 
            }
            
            fg.d3Force('x', null);
            fg.d3Force('y', null);
            fg.d3Force('charge', forceManyBody().strength(-physicsConfig.repulsion));
            fg.d3Force('radial', forceRadial(250, 0, 0).strength((node: any) => {
                return solarNeighbors.has(getNodeIdStr(node)) ? 1 : 0;
            }));
            fg.d3Force('collide', forceCollide(24).strength(1));
            
        } else {
            // === РЕЖИМ 2: ГАЛАКТИКА (Мета-ноди) АБО МІКРО-РІВЕНЬ ===
            fg.d3Force('radial', null);
            
            // 1. Легка гравітація до центру (0,0), щоб граф не розлетівся в нескінченність
            fg.d3Force('x', forceX(0).strength(0.05));
            fg.d3Force('y', forceY(0).strength(0.05));

            // 2. Розумна колізія (бетонні стіни між планетами)
            fg.d3Force('collide', forceCollide((node: any) => {
                if (node.isMetaNode) return node.val + 40; 
                const size = Math.min(20, Math.max(6, (node.val ?? 4)));
                return size + 15;
            }).iterations(2));

            // 3. Розумне відштовхування (магніти)
            fg.d3Force('charge', forceManyBody().strength((node: any) => {
                if (node.isMetaNode) return -800; // Мета-планети масивні
                return -physicsConfig.repulsion;
            }));
        }

        // === ПРУЖИНИ (ЛІНКИ) ДЛЯ ОБОХ РЕЖИМІВ ===
        const linkForce = fg.d3Force('link');
        if (linkForce) {
            linkForce.distance((link: any) => link.isMetaLink ? 250 : physicsConfig.linkDistance);
            linkForce.strength((link: any) => link.isMetaLink ? 0.5 : 0.1);
        }

        fg.d3ReheatSimulation();

        // Запуск початкового центрування
        if (!initialFitDone.current && !zoomScheduledRef.current) {
            zoomScheduledRef.current = true;
            setTimeout(() => {
                if (initialFitDone.current) return;
                initialFitDone.current = true;
                engineIsDone.current = true;
                fgRef.current?.zoomToFit(450, 100);
                setLoadingStep(4);
                setTimeout(() => setLoadingStep(5), 220);
                setTimeout(() => setLoadingStep(6), 440);
                setTimeout(() => setIsInitialFitting(false), 650);
            }, 350);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, engineReadyCount, physicsConfig, dimensions.width, dimensions.height, graphData.nodes, solarSystemNodeId, solarNeighbors, processedData.nodes, clusterMode]);

    useEffect(() => {
        if (!solarSystemNodeId || !fgRef.current) return;
        fgRef.current.centerAt(0, 0, 800);
        fgRef.current.zoom(3, 800);
    }, [solarSystemNodeId]);

    useEffect(() => {
        if (!fgRef.current || contextNodeIds.length === 0) return;
        const nodes = processedData.nodes.filter((n: any) => {
            const id = typeof n.id === "string" ? n.id : n?.id;
            return id != null && contextNodeSet.has(id);
        });
        if (nodes.length === 0) return;
        const padding = 100;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach((n: any) => {
            const nx = Number(n.x), ny = Number(n.y);
            if (isFinite(nx) && isFinite(ny)) {
                minX = Math.min(minX, nx); minY = Math.min(minY, ny);
                maxX = Math.max(maxX, nx); maxY = Math.max(maxY, ny);
            }
        });
        if (!isFinite(minX) || !isFinite(maxX)) return;
        const centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2;
        const boxW = maxX - minX + 2 * padding, boxH = maxY - minY + 2 * padding;
        const k = Math.min(dimensions.width / boxW, dimensions.height / boxH, 4);
        fgRef.current.centerAt(centerX, centerY, 400);
        fgRef.current.zoom(k, 400);
    }, [contextNodeIds.length, contextNodeSet, processedData.nodes, dimensions.width, dimensions.height]);

    const handleZoom = useCallback((_transform: { k: number; x: number; y: number }) => {}, []);

    useEffect(() => {
        if (!flyToNodeId || !fgRef.current) return;
        const node = processedData.nodes.find(
            (n: any) => (typeof n.id === "string" ? n.id : n?.id) === flyToNodeId
        );
        if (node && isFinite(Number(node.x)) && isFinite(Number(node.y))) {
            fgRef.current.centerAt(node.x, node.y, 800);
            fgRef.current.zoom(4, 800);
            const t = setTimeout(() => onFlyToComplete?.(), 850);
            return () => clearTimeout(t);
        }
        onFlyToComplete?.();
    }, [flyToNodeId, processedData.nodes, onFlyToComplete]);

    const ZOOM_FACTOR = 1.25;
    const NAV_DURATION_MS = 250;

    const handleZoomIn = useCallback(() => {
        if (viewMode === '3D') {
            const fg3d = fg3dRef.current;
            if (fg3d?.cameraPosition) {
                const pos = fg3d.cameraPosition();
                if (pos && typeof pos.x === 'number' && typeof pos.y === 'number' && typeof pos.z === 'number') {
                    const scale = 1 / ZOOM_FACTOR;
                    fg3d.cameraPosition({ x: pos.x * scale, y: pos.y * scale, z: pos.z * scale }, { x: 0, y: 0, z: 0 }, NAV_DURATION_MS);
                }
            }
            return;
        }
        if (!fgRef.current) return;
        const k = fgRef.current.zoom();
        if (typeof k === 'number' && Number.isFinite(k)) fgRef.current.zoom(Math.min(8, k * ZOOM_FACTOR), NAV_DURATION_MS);
    }, [viewMode]);

    const handleZoomOut = useCallback(() => {
        if (viewMode === '3D') {
            const fg3d = fg3dRef.current;
            if (fg3d?.cameraPosition) {
                const pos = fg3d.cameraPosition();
                if (pos && typeof pos.x === 'number' && typeof pos.y === 'number' && typeof pos.z === 'number') {
                    const scale = ZOOM_FACTOR;
                    fg3d.cameraPosition({ x: pos.x * scale, y: pos.y * scale, z: pos.z * scale }, { x: 0, y: 0, z: 0 }, NAV_DURATION_MS);
                }
            }
            return;
        }
        if (!fgRef.current) return;
        const k = fgRef.current.zoom();
        if (typeof k === 'number' && Number.isFinite(k)) fgRef.current.zoom(Math.max(0.2, k / ZOOM_FACTOR), NAV_DURATION_MS);
    }, [viewMode]);

    const handleRecenter = useCallback(() => {
        if (viewMode === '3D') { fg3dRef.current?.zoomToFit(1000, 150); return; }
        if (fgRef.current) fgRef.current.zoomToFit(1000, 150);
    }, [viewMode]);

    const navBtnClass = "flex items-center justify-center w-10 h-10 rounded-xl text-neutral-500 hover:bg-black/10 hover:text-black dark:text-neutral-500 dark:hover:bg-white/10 dark:hover:text-white transition-all duration-200 cursor-pointer";

    const graphTheme = getGraphThemeColors(containerRef.current);

    const dataFor3D = useMemo(() => {
        if (viewMode !== '3D') return processedData;
        const getClusterKey = (n: any): string | number =>
            clusterMode === 'group'
                ? getNodeGroupKey(n)
                : (n.tags && n.tags.length > 0 ? n.tags[0] : 'untagged') as string;
        const rawKeys = [...new Set(processedData.nodes.map((n: any) => getClusterKey(n)))];
        const uniqueKeys = clusterMode === 'group'
            ? rawKeys.sort((a, b) => String(a).localeCompare(String(b)))
            : (rawKeys as string[]).sort((a, b) => String(a).localeCompare(String(b)));
        const minDim = Math.min(dimensions.width, dimensions.height);
        const layoutRadius = minDim * 0.48;
        const clusterZ: Record<string | number, number> = {};
        uniqueKeys.forEach((key, i) => {
            const t = uniqueKeys.length > 1 ? (i / (uniqueKeys.length - 1)) * 2 - 1 : 0;
            clusterZ[key] = t * layoutRadius * 0.6;
        });
        const jitterZ = 20;
        const nodes = processedData.nodes.map((n: any) => {
            const key = getClusterKey(n);
            const zCenter = clusterZ[key] ?? 0;
            const idStr = (typeof n.id === 'string' ? n.id : n?.id) ?? '';
            const j = (hashStr(idStr + 'z') - 0.5) * jitterZ;
            const x = typeof n.x === 'number' ? n.x : 0;
            const y = typeof n.y === 'number' ? n.y : 0;
            return { ...n, x, y, z: zCenter + j };
        });
        return { nodes, links: processedData.links };
    }, [viewMode, processedData, clusterMode, dimensions.width, dimensions.height]);

    return (
        <div
            ref={containerRef}
            className="w-full h-screen relative overflow-hidden"
            style={{ backgroundColor: 'var(--graph-bg)' }}
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
        >
            <AnimatePresence>
                {isInitialFitting && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)", transition: { duration: 0.3, ease: "easeIn" } }}
                        className="absolute inset-0 z-[100] flex items-center justify-center bg-white dark:bg-[#050505]"
                    >
                        <div className="flex flex-col items-center gap-10">
                            <div className="relative">
                                <motion.div
                                    animate={loadingStep < 4 ? { rotate: 360 } : { rotate: 0, scale: [1, 1.2, 1] }}
                                    transition={loadingStep < 4
                                        ? { duration: 2, repeat: Infinity, ease: "linear" }
                                        : { duration: 0.4, ease: "easeOut" }
                                    }
                                    className={loadingStep >= 4 ? "text-emerald-500" : "text-indigo-600 dark:text-purple-500"}
                                >
                                    <Orbit size={48} strokeWidth={1.5} />
                                </motion.div>
                                {loadingStep < 4 && (
                                    <motion.div
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        className="absolute -inset-4 border border-indigo-500/20 rounded-full"
                                    />
                                )}
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-6 overflow-hidden flex items-center justify-center">
                                    <AnimatePresence mode="wait">
                                        <motion.p
                                            key={loadingStep}
                                            initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                            exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
                                            transition={{ duration: 0.3 }}
                                            className={`font-mono text-[10px] md:text-xs tracking-[0.5em] uppercase font-bold ${
                                                loadingStep >= 4 ? "text-emerald-500" : "text-neutral-500 dark:text-neutral-400"
                                            }`}
                                        >
                                            {loadingLabels[loadingStep]}
                                        </motion.p>
                                    </AnimatePresence>
                                </div>
                                <div className="h-4 flex items-center justify-center">
                                    {loadingStep < 4 ? (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-[12px] font-mono text-neutral-400/50 dark:text-neutral-500/50 uppercase tracking-[0.2em] text-shimmer-muted"
                                        >
                                            {`0x${(loadingStep * 25).toString(16)}FF...${Math.floor(Math.random() * 100)}%`}
                                        </motion.span>
                                    ) : (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="text-[8px] font-mono text-emerald-500/60 uppercase tracking-[0.2em]"
                                        >
                                            Connection Stable
                                        </motion.span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <>
                {viewMode === '2D' && (
                    <motion.div
                        key="graph-2d"
                        className="absolute inset-0 w-full h-full"
                        initial={{ opacity: 0, filter: "blur(10px)", scale: 0.97 }}
                        animate={{ opacity: 1, filter: "blur(0px)", scale: 1, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } }}
                        exit={{ opacity: 0, filter: "blur(10px)", scale: 0.97, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
                    >
                        <GraphNetwork2D
                            ref={fgRef}
                            width={dimensions.width}
                            height={dimensions.height}
                            graphData={processedData}
                            nodeVal={(node: any) => node.val ?? 4}
                            nodeLabel={getNodeLabel}
                            nodeCanvasObject={drawNode}
                            onRenderFramePre={handleRenderFramePre}
                            onZoom={handleZoom}
                            warmupTicks={0}
                            d3AlphaDecay={0.4}
                            d3VelocityDecay={0.35}
                            d3AlphaMin={0.001}
                            onNodeClick={(node: any) => {
                                if (node.isMetaNode) {
                                    // Провалюємось у групу
                                    setActiveGroupId(node.groupId);
                                    // Дозволяємо фізиці розкласти ноди, потім центруємо
                                    setTimeout(() => {
                                        fgRef.current?.zoomToFit(800, 100);
                                    }, 100);
                                } else {
                                    // Звичайний клік по ноді – відкриває твій існуючий Sidebar
                                    if (fgRef.current && isFinite(Number(node.x)) && isFinite(Number(node.y))) {
                                        fgRef.current.centerAt(node.x, node.y, 800);
                                        fgRef.current.zoom(4, 800);
                                    }
                                    if (!readOnly) onNodeSelect(node);
                                }
                            }}
                            onNodeRightClick={(node, event) => {
                                if (!readOnly && onNodeContextMenu) onNodeContextMenu(node, event as unknown as MouseEvent);
                            }}
                            onBackgroundClick={() => { if (onBackgroundClick) onBackgroundClick(); }}
                            onLinkHover={(link) => setHoveredLink(link)}
                            nodePointerAreaPaint={(node: any, color, ctx) => {
                                const x = node.x ?? 0, y = node.y ?? 0;
                                if (!isFinite(x) || !isFinite(y)) return;
                                const rawSize = (node.val ?? 4) * 1;
                                let radius = Math.min(20, Math.max(6, rawSize));
                                const nodeId = typeof node.id === 'string' ? node.id : node.id?.id;
                                if (pathfinderActive && pathNodeSet.has(nodeId)) radius = radius * 1.2;
                                else if (searchActive && highlightedSet.has(nodeId)) radius = radius * 1.2;
                                ctx.fillStyle = color;
                                ctx.beginPath();
                                ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
                                ctx.fill();
                            }}
                            nodeColor={(node: any) => {
                                const theme = getGraphThemeColors(containerRef.current);
                                const nodeId = typeof node.id === 'string' ? node.id : node.id?.id;
                                const dimColor = theme.nodeColor.startsWith('#') ? hexToRgba(theme.nodeColor, 0.12) : theme.nodeColor;
                                if (solarSystemNodeId) {
                                    if (!solarNeighbors.has(nodeId)) return dimColor;
                                    if (nodeId === solarSystemNodeId) return "#eab308";
                                    const groupKey = nodeIdToGroupKeyMap.get(nodeId) ?? getNodeGroupKey(node);
                                    return getGroupColor(groupKey, groupColorsById) ?? groupColors[typeof groupKey === 'number' ? groupKey : 1] ?? "#06b6d4";
                                }
                                if (pathfinderActive) {
                                    if (pathNodeSet.has(nodeId)) {
                                        const startId = pathNodes[0];
                                        const endId = pathNodes.length > 0 ? pathNodes[pathNodes.length - 1] : null;
                                        if (nodeId === startId) return "#06b6d4";
                                        if (endId != null && nodeId === endId) return "#f97316";
                                        return "#06b6d4";
                                    }
                                    return dimColor;
                                }
                                if (searchActive) {
                                    if (highlightedSet.has(nodeId)) return accentHex();
                                    return dimColor;
                                }
                                if (zenModeNodeId && !zenModeNeighbors.has(nodeId)) return dimColor;
                                if (activeTag && (!node.tags || !node.tags.includes(activeTag))) return dimColor;
                                if (nodeId === focusedNodeId) return "#fbbf24";
                                const groupKey = nodeIdToGroupKeyMap.get(nodeId) ?? getNodeGroupKey(node);
                                return getGroupColor(groupKey, groupColorsById) ?? groupColors[typeof groupKey === 'number' ? groupKey : 1] ?? "#ec4899";
                            }}
                            linkWidth={(link: any) => {
                                if (solarSystemNodeId && !isLinkHidden(link)) return 2;
                                if (pathfinderActive) return isPathLink(link) ? 4 : 0.5;
                                return link === hoveredLink ? 2 : link.weight || 1;
                            }}
                            linkDirectionalParticles={(link: any) => {
                                if (isLinkHidden(link)) return 0;
                                if (pathfinderActive && isPathLink(link)) return 4;
                                return 5;
                            }}
                            linkDirectionalParticleSpeed={pathfinderActive ? 0.0001 : 0.0001}
                            linkDirectionalParticleWidth={4}
                            linkDirectionalParticleColor={() => {
                                const theme = getGraphThemeColors(containerRef.current);
                                return theme.nodeColor;
                            }}
                            linkColor={(link: any) => {
                                const theme = getGraphThemeColors(containerRef.current);
                                if (isLinkHidden(link)) return "rgba(0,0,0,0)";
                                if (solarSystemNodeId) return "rgba(251, 191, 36, 0.9)";
                                if (pathfinderActive && isPathLink(link)) return "rgba(6, 182, 212, 0.8)";
                                if (pathfinderActive) return "rgba(0,0,0,0)";
                                if (link === hoveredLink) return link.relationType === 'ai' ? accentHex() : theme.nodeColor;
                                return link.relationType === 'ai' ? accentRgba(0.4) : theme.linkColor;
                            }}
                            backgroundColor="rgba(0,0,0,0)"
                            enablePointerInteraction={true}
                            onEngineStop={handleEngineStop}
                            graphTheme={graphTheme}
                            onLinkRightClick={(link, event) => {
                                if (!readOnly && onNodeContextMenu) onNodeContextMenu(link, event as unknown as MouseEvent);
                            }}
                        />
                    </motion.div>
                )}
                {viewMode === '3D' && (
                    <motion.div
                        key="graph-3d"
                        className="absolute inset-0 w-full h-full"
                        initial={{ opacity: 0, filter: "blur(10px)", scale: 1.03 }}
                        animate={{ opacity: 1, filter: "blur(0px)", scale: 1, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } }}
                        exit={{ opacity: 0, filter: "blur(10px)", scale: 1.03, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
                    >
                        <GraphNetwork3D
                            key={`3d-${threeDKeyRef.current}`}
                            ref={fg3dRef}
                            width={dimensions.width}
                            height={dimensions.height}
                            graphData={dataFor3D}
                            graphTheme={graphTheme}
                            groupColorsById={groupColorsById}
                            groupNamesById={groupNamesById}
                            groupDescriptionsById={groupDescriptionsById}
                            nodeIdToGroupKeyMap={nodeIdToGroupKeyMap}
                            getNodeGroupKey={getNodeGroupKey}
                            getNodeLabel={getNodeLabel}
                            getNodeIconUrl={getNodeIconUrl}
                            linkDistance={physicsConfig.linkDistance}
                            readOnly={readOnly}
                            onNodeSelect={onNodeSelect}
                            onNodeContextMenu={onNodeContextMenu}
                            onBackgroundClick={onBackgroundClick}
                        />
                    </motion.div>
                )}
            </>
            {graphData.nodes.length > 0 && (
                <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-1 p-1.5 rounded-2xl backdrop-blur-xl bg-black/[0.05] border border-black/10 dark:bg-white/[0.03] dark:border-white/10 shadow-lg pointer-events-none overflow-hidden">
                    <div className="pointer-events-auto flex flex-col gap-1 overflow-hidden">
                        <AnimatePresence initial={false} mode="wait">
                            {viewMode === '2D' && (
                                <motion.div
                                    key="nav-zoom-recenter"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
                                    className="flex flex-col gap-1 origin-top"
                                >
                                    <button type="button" onClick={handleZoomIn} className={navBtnClass} title="Zoom in" aria-label="Zoom in"><ZoomIn size={18} /></button>
                                    <button type="button" onClick={handleZoomOut} className={navBtnClass} title="Zoom out" aria-label="Zoom out"><ZoomOut size={18} /></button>
                                    <button type="button" onClick={handleRecenter} className={navBtnClass} title="Recenter / Fit to screen" aria-label="Recenter"><Locate size={18} /></button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {activeGroupId !== null && (
                                <motion.div
                                    key="nav-zoom-exit"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
                                    className="flex flex-col gap-1 origin-top"
                                >
                                    <button type="button" onClick={() => {
                                        setActiveGroupId(null);
                                        setTimeout(() => fgRef.current?.zoomToFit(800, 100), 50);
                                    }} className={navBtnClass} title={`Exit ${getGroupLabel(activeGroupId, groupNamesById)} Cluster`} aria-label="Recenter"><Boxes size={18} /></button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {/* {canUse3DGraph ? (
                            <button
                                type="button"
                                onClick={() => onViewModeChange?.(viewMode === '3D' ? '2D' : '3D')}
                                className={viewMode === '3D'
                                    ? "flex items-center justify-center w-10 h-10 rounded-xl text-white bg-indigo-600/80 dark:bg-purple-500/80 hover:bg-indigo-600 dark:hover:bg-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.45)] dark:shadow-[0_0_24px_rgba(168,85,247,0.5)] transition-all duration-200 cursor-pointer"
                                    : navBtnClass}
                                title="Toggle 3D Universe"
                                aria-label={viewMode === '3D' ? 'Switch to 2D' : 'Switch to 3D'}
                            >
                                <Box size={18} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={onRequest3DUpgrade}
                                className="flex items-center justify-center w-10 h-10 rounded-xl text-neutral-500 opacity-70 hover:opacity-100 hover:bg-indigo-500/10 dark:hover:bg-purple-500/10 hover:shadow-[0_0_12px_rgba(99,102,241,0.2)] dark:hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all cursor-pointer relative"
                                title="3D Universe (Singularity only)"
                                aria-label="3D Universe (Singularity only)"
                            >
                                <Box size={18} />
                                <Lock size={10} className="absolute bottom-0.5 right-0.5 text-indigo-500 dark:text-purple-400" />
                            </button>
                        )} */}
                        {/* {renderToolbarExtra?.(navBtnClass)} */}
                    </div>
                </div>
            )}
            <AnimatePresence>
                {hoveredLink && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute z-50 pointer-events-none bg-white/95 dark:bg-neutral-900/90 backdrop-blur-md border border-black/10 dark:border-white/10 px-4 py-3 rounded-xl shadow-xl dark:shadow-2xl flex flex-col gap-1 min-w-[200px]"
                        style={{ left: mousePos.x + 15, top: mousePos.y + 15 }}
                    >
                        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-1">
                            {hoveredLink.relationType === 'ai' ? (
                                <><Sparkles size={12} className="text-indigo-600 dark:text-purple-400" /><span className="text-indigo-600 dark:text-purple-400">AI Connection</span></>
                            ) : (
                                <><LinkIcon size={12} className="text-neutral-500 dark:text-neutral-400" /><span className="text-neutral-600 dark:text-neutral-400">Logical connection</span></>
                            )}
                        </div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{hoveredLink.label || "Communication"}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}