/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { forceManyBody, forceX, forceY, forceRadial, forceCollide } from 'd3-force';
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Lightbulb, LinkIcon, Sparkles, ZoomIn, ZoomOut, Locate, Box, Lock, Orbit } from "lucide-react";
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

const tagNeonPalette = [
    "#06b6d4", "#4f46e5", "#f97316", "#10b981", "#ec4899",
    "#eab308", "#6366f1", "#14b8a6", "#f43f5e", "#8b5cf6",
];

function getColorForTag(tag: string): string {
    let h = 0;
    for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
    const idx = Math.abs(h) % tagNeonPalette.length;
    return tagNeonPalette[idx] ?? tagNeonPalette[0];
}

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

function getClusterKeyForDraw(node: any, clusterMode: 'group' | 'tag', nodeIdToGroupKey: Map<string | number, string | number>): number | string | null {
    if (clusterMode === 'group') {
        const nodeId = typeof node.id === 'string' ? node.id : node?.id;
        const key = nodeId != null ? (nodeIdToGroupKey.get(nodeId) ?? getNodeGroupKey(node)) : getNodeGroupKey(node);
        return key ?? null;
    }
    return (node.tags && node.tags.length > 0 ? node.tags[0] : 'untagged') as string;
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

function drawGroupAreas(
    ctx: CanvasRenderingContext2D,
    nodes: any[],
    dimensions: { width: number; height: number },
    _globalScale: number,
    nodeIdToGroupKey: Map<string | number, string | number>,
    clusterMode: 'group' | 'tag',
    container: HTMLElement | null,
    groupColorsById: Record<string, string>,
    groupNamesById: Record<string, string>
) {
    const byCluster: Record<string, { x: number; y: number }[]> = {};
    for (const node of nodes) {
        const key = getClusterKeyForDraw(node, clusterMode, nodeIdToGroupKey);
        if (key == null) continue;
        const keyStr = String(key);
        const x = Number(node.x);
        const y = Number(node.y);
        if (!isFinite(x) || !isFinite(y)) continue;
        if (!byCluster[keyStr]) byCluster[keyStr] = [];
        byCluster[keyStr].push({ x, y });
    }

    const prevComposite = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = "screen";

    for (const keyStr of Object.keys(byCluster)) {
        const points = byCluster[keyStr];
        if (!points?.length) continue;
        const centerX = points.reduce((a, p) => a + p.x, 0) / points.length;
        const centerY = points.reduce((a, p) => a + p.y, 0) / points.length;
        if (!isFinite(centerX) || !isFinite(centerY)) continue;
        const maxDist = points.reduce((max, p) => Math.max(max, Math.hypot(p.x - centerX, p.y - centerY)), 0);
        const radius = Math.min(dimensions.width + dimensions.height, Math.max(80, maxDist * 1.2));
        if (!isFinite(radius) || radius <= 0) continue;
        const key: string | number = /^\d+$/.test(keyStr) ? Number(keyStr) : keyStr;
        const color = clusterMode === 'group'
            ? (getGroupColor(key, groupColorsById) ?? groupColors[Number(keyStr)])
            : getColorForTag(keyStr);
        if (!color) continue;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, color + "19");
        gradient.addColorStop(0.5, color + "0D");
        gradient.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    ctx.globalCompositeOperation = prevComposite;

    for (const keyStr of Object.keys(byCluster)) {
        const points = byCluster[keyStr];
        if (!points?.length) continue;
        const centerX = points.reduce((a, p) => a + p.x, 0) / points.length;
        const centerY = points.reduce((a, p) => a + p.y, 0) / points.length;
        if (!isFinite(centerX) || !isFinite(centerY)) continue;
        const key: string | number = /^\d+$/.test(keyStr) ? Number(keyStr) : keyStr;
        const label = clusterMode === 'group' ? getGroupLabel(key, groupNamesById) : `#${keyStr}`;
        const themeColors = getGraphThemeColors(container);
        const labelColor = themeColors.nodeColor.startsWith('#')
            ? themeColors.nodeColor
            : themeColors.nodeColor.replace(/,\s*[\d.]+\)$/, ', 0.9)');
        ctx.font = "600 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.fillStyle = labelColor;
        ctx.fillText(label, centerX, centerY);
        ctx.shadowBlur = 0;
    }
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
    physicsConfig: {
        nodeSpeed: number;
        clusterSpeed: number; repulsion: number; linkDistance: number 
};
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

// ─── Orbit layout constants ──────────────────────────────────────────────────
// Nodes are spread across concentric rings inside each cluster.
const ORBIT_NODES_PER_RING = 6;   // max nodes on the innermost ring
const ORBIT_RING_BASE_R    = 60;  // px from cluster center to ring-0
const ORBIT_RING_GAP       = 52;  // extra px per ring
const ORBIT_MAX_DRAG_R     = 160; // max px a node may be dragged from its live cluster center

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
    renderToolbarExtra,
    canUse3DGraph = false,
    onRequest3DUpgrade,
    viewMode = '2D',
    onViewModeChange,
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
    const ambientRafRef = useRef<number>(0);

    // ── CHANGE 1: promote orbit maps to refs so drag handlers can reach them ─
    const orbitMapRef = useRef<Map<any, { radius: number; angle: number; speedFactor: number }>>(new Map());
    const clusterOrbitMapRef = useRef<Map<string | number, { radius: number; angle: number; speedFactor: number }>>(new Map());
    // Live (currently-orbiting) cluster center positions, updated every RAF tick
    const liveClusterCentersRef = useRef<Record<string | number, { x: number; y: number }>>({});

    // Node currently being dragged — RAF tick skips it
    const draggingNodeRef = useRef<any>(null);

    // Always mirrors the latest physicsConfig so the orbital tick can read
    // nodeSpeed / clusterSpeed live without restarting the effect.
    const physicsConfigRef = useRef(physicsConfig);
    physicsConfigRef.current = physicsConfig;

    // True while d3 is reheating after a physicsConfig change.
    // The orbital RAF keeps the canvas refreshing but stops overwriting node
    // positions so physics can freely move them. Cleared after settling.
    const physicsSettlingRef = useRef(false);
    const physicsSettlingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Whether the orbital animation has been initialized; lives at component level
    // so the physics settling timer can reset it and trigger re-init.
    const orbitInitializedRef = useRef(false);
    // True only for the very first init — uses ring layout for nice spacing.
    // Stays false after that so re-init after physics captures actual positions.
    const orbitFirstInitRef = useRef(true);

    const initialFitDone = useRef(false);
    const threeDKeyRef = useRef(0);
    const [engineReadyCount, setEngineReadyCount] = useState(0);

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
        const degreeMap: Record<string, number> = {};
        workingLinks.forEach((link: any) => {
            const sId = getNodeId(link.source);
            const tId = getNodeId(link.target);
            if (sId != null) degreeMap[sId] = (degreeMap[sId] ?? 0) + 1;
            if (tId != null && tId !== sId) degreeMap[tId] = (degreeMap[tId] ?? 0) + 1;
        });
        const minDim = Math.min(dimensions.width, dimensions.height);
        const layoutRadius = minDim * 0.28;
        const getClusterKey = (n: any): string | number =>
            clusterMode === 'group'
                ? getNodeGroupKey(n)
                : (n.tags && n.tags.length > 0 ? n.tags[0] : 'untagged') as string;
        const clusterCenters = buildClusterCenters2D(workingNodes, clusterMode, layoutRadius);
        const jitter = 28;
        const nodesWithVal = workingNodes.map((node: any, index: number) => {
            const id = getNodeId(node);
            const degree = degreeMap[id] ?? 0;
            const val = Math.min(4 + degree * 1.5, 20);
            const idStr = id != null ? String(id) : `i${index}`;
            const key = getClusterKey(node);
            const center = clusterCenters[key];
            const dx = center ? jitter * (hashStr(idStr + 'x') - 0.5) : 0;
            const dy = center ? jitter * (hashStr(idStr + 'y') - 0.5) : 0;
            const x = center ? center.x + dx : 0;
            const y = center ? center.y + dy : 0;
            return { ...node, val, x, y };
        });
        const linksCopy = workingLinks.map((link: any) => ({ ...link }));
        if (pathfinderActive) {
            const pathSet = new Set(pathNodes);
            const dim: any[] = [], bright: any[] = [];
            nodesWithVal.forEach((n: any) => {
                const id = getNodeId(n);
                if (pathSet.has(id)) bright.push(n); else dim.push(n);
            });
            return { nodes: [...dim, ...bright], links: linksCopy };
        }
        if (searchActive) {
            const dim: any[] = [], bright: any[] = [];
            nodesWithVal.forEach((n: any) => {
                const id = getNodeId(n);
                if (highlightedSet.has(id)) bright.push(n); else dim.push(n);
            });
            return { nodes: [...dim, ...bright], links: linksCopy };
        }
        return { nodes: nodesWithVal, links: linksCopy };
    }, [graphData, searchActive, highlightedSet, pathfinderActive, pathNodes, timelineDate, dimensions.width, dimensions.height, clusterMode]);

    const getNodeIconUrl = useCallback((node: any) => {
        if (node.type === 'link' && node.url) {
            try {
                const domain = new URL(node.url).hostname;
                return `/api/favicon?domain=${domain}`;
            } catch { return null; }
        }
        return null;
    }, []);

    // ── CHANGE 2: Orbital animation — uses refs, skips dragged node, ring layout
    useEffect(() => {
        if (viewMode !== '2D') return;

        // Reset refs on re-init (clusterMode or nodes changed)
        orbitMapRef.current.clear();
        clusterOrbitMapRef.current.clear();

        const initializedRef = orbitInitializedRef;
        initializedRef.current = false; // reset on every effect run (clusterMode/nodes changed)

        // speedFactor per orbit entry is the golden-ratio variation (0.7–1.3).
        // Actual angular step = speedFactor × physicsConfigRef.current.nodeSpeed/clusterSpeed / 10000 × dt
        // Because we read from physicsConfigRef on every tick, slider changes are instant.
        const GOLDEN = 2.399;

        const getClusterKey = (node: any): string | number =>
            clusterMode === 'group'
                ? getNodeGroupKey(node)
                : (node.tags && node.tags.length > 0 ? node.tags[0] : 'untagged') as string;

        const init = (): boolean => {
            const nodes = processedData.nodes;
            if (!nodes.length) return false;

            const settled = nodes.filter((n: any) =>
                isFinite(n.x) && isFinite(n.y) && (Math.abs(n.x) > 1 || Math.abs(n.y) > 1)
            );
            if (settled.length < nodes.length * 0.8) return false;

            if (orbitFirstInitRef.current) {
                // ── First init: use geometric cluster centers + ring layout ──────
                orbitFirstInitRef.current = false;

                const centers = clusterCentersRef.current;
                if (!Object.keys(centers).length) return false;

                Object.entries(centers).forEach(([keyStr, center], i) => {
                    const key: string | number = /^\d+$/.test(keyStr) ? Number(keyStr) : keyStr;
                    const radius = Math.hypot(center.x, center.y);
                    const angle  = Math.atan2(center.y, center.x);
                    // speedFactor: cluster variation (0.8–1.2)
                    const speedFactor = 0.8 + ((i * GOLDEN) % 1) * 0.4;
                    clusterOrbitMapRef.current.set(key, { radius: Math.max(10, radius), angle, speedFactor });
                });

                const byCluster = new Map<string | number, any[]>();
                nodes.forEach((node: any) => {
                    if (node.fx != null) return;
                    const key = getClusterKey(node);
                    if (!byCluster.has(key)) byCluster.set(key, []);
                    byCluster.get(key)!.push(node);
                });
                byCluster.forEach((clusterNodes) => {
                    const total = clusterNodes.length;
                    clusterNodes.forEach((node: any, localIdx: number) => {
                        const ring        = Math.floor(localIdx / ORBIT_NODES_PER_RING);
                        const posInRing   = localIdx % ORBIT_NODES_PER_RING;
                        const ringCount   = Math.min(ORBIT_NODES_PER_RING, total - ring * ORBIT_NODES_PER_RING);
                        const angle       = (posInRing / ringCount) * 2 * Math.PI + ring * (Math.PI / ORBIT_NODES_PER_RING);
                        const radius      = ORBIT_RING_BASE_R + ring * ORBIT_RING_GAP;
                        const globalIdx   = nodes.indexOf(node);
                        // speedFactor: node variation (0.7–1.3)
                        const speedFactor = 0.7 + ((globalIdx * GOLDEN) % 1) * 0.6;
                        orbitMapRef.current.set(node, { radius, angle, speedFactor });
                    });
                });

            } else {
                // ── Re-init after physicsConfig change: capture from actual positions ──
                const actualCenters = new Map<string | number, { x: number; y: number; n: number }>();
                nodes.forEach((node: any) => {
                    if (node.fx != null) return;
                    const key = getClusterKey(node);
                    if (!actualCenters.has(key)) actualCenters.set(key, { x: 0, y: 0, n: 0 });
                    const c = actualCenters.get(key)!;
                    c.x += node.x ?? 0;
                    c.y += node.y ?? 0;
                    c.n++;
                });
                actualCenters.forEach(c => { c.x /= c.n; c.y /= c.n; });

                let i = 0;
                actualCenters.forEach((center, key) => {
                    const radius      = Math.hypot(center.x, center.y);
                    const angle       = Math.atan2(center.y, center.x);
                    const speedFactor = 0.8 + ((i * GOLDEN) % 1) * 0.4;
                    clusterOrbitMapRef.current.set(key, { radius: Math.max(10, radius), angle, speedFactor });
                    i++;
                });

                nodes.forEach((node: any) => {
                    if (node.fx != null) return;
                    const key         = getClusterKey(node);
                    const center      = actualCenters.get(key) ?? { x: 0, y: 0 };
                    const dx          = (node.x ?? 0) - center.x;
                    const dy          = (node.y ?? 0) - center.y;
                    const globalIdx   = nodes.indexOf(node);
                    const speedFactor = 0.7 + ((globalIdx * GOLDEN) % 1) * 0.6;
                    orbitMapRef.current.set(node, {
                        radius: Math.max(10, Math.hypot(dx, dy)),
                        angle:  Math.atan2(dy, dx),
                        speedFactor,
                    });
                });
            }

            return orbitMapRef.current.size > 0;
        };

        let lastTime = 0;
        const tick = (now: number) => {
            const fg = fgRef.current;
            const dt = Math.min(lastTime ? now - lastTime : 16, 64);
            lastTime = now;

            if (fg) {
                if (!initializedRef.current) initializedRef.current = init();

                if (initializedRef.current) {
                    // While physics is reheating (slider change), let d3 move nodes freely.
                    if (physicsSettlingRef.current) {
                        fg.refresh?.();
                        ambientRafRef.current = requestAnimationFrame(tick);
                        return;
                    }

                    // Read live speed values from ref — responds instantly to slider changes.
                    const nodeSpeedBase    = physicsConfigRef.current.nodeSpeed    / 1000000;
                    const clusterSpeedBase = physicsConfigRef.current.clusterSpeed / 1000000;

                    // Step 1 — advance cluster centers around (0,0)
                    const liveCenters: Record<string | number, { x: number; y: number }> = {};
                    clusterOrbitMapRef.current.forEach((orbit, key) => {
                        orbit.angle += orbit.speedFactor * clusterSpeedBase * dt;
                        liveCenters[key] = {
                            x: Math.cos(orbit.angle) * orbit.radius,
                            y: Math.sin(orbit.angle) * orbit.radius,
                        };
                    });
                    liveClusterCentersRef.current = liveCenters;

                    // Step 2 — advance node orbits around their moving cluster center
                    orbitMapRef.current.forEach((orbit, node) => {
                        if (node === draggingNodeRef.current) return;
                        orbit.angle += orbit.speedFactor * nodeSpeedBase * dt;
                        const key    = getClusterKey(node);
                        const center = liveCenters[key] ?? clusterCentersRef.current[key] ?? { x: 0, y: 0 };
                        node.x = center.x + Math.cos(orbit.angle) * orbit.radius;
                        node.y = center.y + Math.sin(orbit.angle) * orbit.radius;
                    });

                    fg.refresh?.();
                }
            }

            ambientRafRef.current = requestAnimationFrame(tick);
        };

        // First load: 700ms. Re-init after physicsConfig change: 900ms so the
        // reheat simulation has time to fully settle before orbit re-captures positions.
        const isReInit = orbitMapRef.current.size > 0;
        const startDelay = isReInit ? 900 : 700;

        const startTimer = setTimeout(() => {
            ambientRafRef.current = requestAnimationFrame(tick);
        }, startDelay);

        return () => {
            clearTimeout(startTimer);
            cancelAnimationFrame(ambientRafRef.current);
            orbitMapRef.current.clear();
            clusterOrbitMapRef.current.clear();
            orbitFirstInitRef.current = true; // next run starts fresh with ring layout
        };
    }, [viewMode, processedData.nodes, clusterMode]);

    // ── CHANGE 3: drag handlers ───────────────────────────────────────────────
    const getClusterKeyForNode = useCallback((node: any): string | number =>
        clusterMode === 'group'
            ? getNodeGroupKey(node)
            : (node.tags && node.tags.length > 0 ? node.tags[0] : 'untagged') as string,
    [clusterMode]);

    const handleNodeDrag = useCallback((node: any) => {
        draggingNodeRef.current = node;

        // Clamp position to ORBIT_MAX_DRAG_R from the live cluster center
        const key        = getClusterKeyForNode(node);
        const liveCenter = liveClusterCentersRef.current[key]
                        ?? clusterCentersRef.current[key]
                        ?? { x: 0, y: 0 };

        const dx   = (node.x ?? 0) - liveCenter.x;
        const dy   = (node.y ?? 0) - liveCenter.y;
        const dist = Math.hypot(dx, dy);
        if (dist > ORBIT_MAX_DRAG_R) {
            const s = ORBIT_MAX_DRAG_R / dist;
            node.x  = liveCenter.x + dx * s;
            node.y  = liveCenter.y + dy * s;
        }
    }, [getClusterKeyForNode]);

    const handleNodeDragEnd = useCallback((node: any) => {
        draggingNodeRef.current = null;

        // Re-capture orbit from the dropped position so animation resumes from here
        const key          = getClusterKeyForNode(node);
        const clusterOrbit = clusterOrbitMapRef.current.get(key);
        const liveCenter   = clusterOrbit
            ? {
                x: Math.cos(clusterOrbit.angle) * clusterOrbit.radius,
                y: Math.sin(clusterOrbit.angle) * clusterOrbit.radius,
            }
            : clusterCentersRef.current[key];

        if (!liveCenter) return;
        const existing = orbitMapRef.current.get(node);
        if (!existing) return;

        const dx = (node.x ?? 0) - liveCenter.x;
        const dy = (node.y ?? 0) - liveCenter.y;
        existing.radius = Math.max(10, Math.hypot(dx, dy));
        existing.angle  = Math.atan2(dy, dx);
        // speed intentionally preserved
    }, [getClusterKeyForNode]);

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
            drawGroupAreas(ctx, processedData.nodes, dimensions, globalScale, nodeIdToGroupKeyMap, clusterMode, containerRef.current, groupColorsById, groupNamesById);
        },
        [processedData.nodes, dimensions, nodeIdToGroupKeyMap, clusterMode, solarSystemNodeId, groupColorsById, groupNamesById]
    );

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({ width: containerRef.current.offsetWidth, height: window.innerHeight });
        }
    }, []);

    useEffect(() => {
        if (viewMode !== '2D') return;
        if (!fgRef.current) return;
        const fg = fgRef.current;
        const minDim = Math.min(dimensions.width, dimensions.height);
        const radius = minDim * 0.28;

        const getClusterKey = (node: any): string | number => {
            if (clusterMode === 'group') return getNodeGroupKey(node);
            return (node.tags && node.tags.length > 0 ? node.tags[0] : 'untagged') as string;
        };

        const clusterCenters = buildClusterCenters2D(processedData.nodes, clusterMode, radius);
        clusterCentersRef.current = clusterCenters;

        fg.d3Force('x', forceX((node: any) => clusterCentersRef.current[getClusterKey(node)]?.x ?? 0).strength(0.4));
        fg.d3Force('y', forceY((node: any) => clusterCentersRef.current[getClusterKey(node)]?.y ?? 0).strength(0.4));

        const jitter = 28;
        processedData.nodes.forEach((node: any) => {
            // Only seed if the node has no valid position yet (first load / new node).
            // On physicsConfig changes nodes are already placed — resetting them here
            // is what caused the "jumps back to original position" bug.
            const alreadyPlaced = isFinite(node.x) && isFinite(node.y)
                && (Math.abs(node.x) > 1 || Math.abs(node.y) > 1);
            if (alreadyPlaced) return;
            const key = getClusterKey(node);
            const center = clusterCenters[key];
            if (!center) return;
            const idStr = (typeof node.id === 'string' ? node.id : node?.id) ?? '';
            const dx = jitter * (hashStr(String(idStr) + 'x') - 0.5);
            const dy = jitter * (hashStr(String(idStr) + 'y') - 0.5);
            (node as any).x = center.x + dx;
            (node as any).y = center.y + dy;
        });

        const getNodeIdStr = (node: any) => typeof node.id === 'string' ? node.id : node.id?.id;

        if (solarSystemNodeId && solarNeighbors.size > 0) {
            const centerNode = processedData.nodes.find((n: any) => getNodeIdStr(n) === solarSystemNodeId);
            if (centerNode) { (centerNode as any).fx = 0; (centerNode as any).fy = 0; }
            fg.d3Force('x', null);
            fg.d3Force('y', null);
            fg.d3Force('radial', forceRadial(250, 0, 0).strength((node: any) =>
                solarNeighbors.has(getNodeIdStr(node)) ? 1 : 0
            ));
            fg.d3Force('collide', forceCollide(24).strength(1));
        } else {
            processedData.nodes.forEach((node: any) => { delete (node as any).fx; delete (node as any).fy; });
            fg.d3Force('radial', null);
            fg.d3Force('collide', null);
            fg.d3Force('x', forceX((node: any) => clusterCenters[getClusterKey(node)]?.x ?? 0).strength(0.4));
            fg.d3Force('y', forceY((node: any) => clusterCenters[getClusterKey(node)]?.y ?? 0).strength(0.4));
        }

        fg.d3Force('charge', forceManyBody().strength(-physicsConfig.repulsion));
        fg.d3Force('center', null);

        const linkForce = fg.d3Force('link');
        if (linkForce) {
            linkForce.distance(physicsConfig.linkDistance);
            linkForce.strength((link: any) => {
                const sNode = typeof link.source === 'object' ? link.source : processedData.nodes.find((n: any) => (typeof n.id === 'string' ? n.id : n?.id) === link.source);
                const tNode = typeof link.target === 'object' ? link.target : processedData.nodes.find((n: any) => (typeof n.id === 'string' ? n.id : n?.id) === link.target);
                const s = sNode != null ? getClusterKey(sNode) : undefined;
                const t = tNode != null ? getClusterKey(tNode) : undefined;
                return s !== undefined && t !== undefined && s === t ? 0.7 : 0.1;
            });
        }

        fg.d3ReheatSimulation();

        // If the graph is already up (physicsConfig slider change), pause orbital
        // writes so d3 can move nodes freely, then re-capture orbits once settled.
        if (initialFitDone.current) {
            physicsSettlingRef.current = true;
            if (physicsSettlingTimerRef.current) clearTimeout(physicsSettlingTimerRef.current);
            physicsSettlingTimerRef.current = setTimeout(() => {
                // Re-init orbit positions from wherever physics left nodes.
                // Must reset orbitInitializedRef so the orbital tick calls init() again.
                orbitMapRef.current.clear();
                clusterOrbitMapRef.current.clear();
                orbitInitializedRef.current = false;
                physicsSettlingRef.current = false;
            }, 1200);
        }

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
                                            className="text-[12px] font-mono text-neutral-400/50 uppercase tracking-[0.2em]"
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
                                if (fgRef.current && isFinite(Number(node.x)) && isFinite(Number(node.y))) {
                                    fgRef.current.centerAt(node.x, node.y, 800);
                                    fgRef.current.zoom(4, 800);
                                }
                                if (!readOnly) onNodeSelect(node);
                            }}
                            onNodeRightClick={(node, event) => {
                                if (!readOnly && onNodeContextMenu) onNodeContextMenu(node, event as unknown as MouseEvent);
                            }}
                            // ── CHANGE 4: wire drag handlers ─────────────────
                            onNodeDrag={handleNodeDrag}
                            onNodeDragEnd={handleNodeDragEnd}
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
                                return link.relationType === 'ai' ? physicsConfig.linkDistance / 20 : 0;
                            }}
                            linkDirectionalParticleSpeed={pathfinderActive ? 0.01 : 0.005}
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
                            physicsConfig={physicsConfig}
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
                        {canUse3DGraph ? (
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
                        )}
                        {renderToolbarExtra?.(navBtnClass)}
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