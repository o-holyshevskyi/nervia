/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from 'next/dynamic';
import { forceManyBody, forceX, forceY, forceRadial, forceCollide } from 'd3-force';
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Lightbulb, LinkIcon, Sparkles } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

const ForceGraph2D = dynamic(() => import ('react-force-graph-2d'), {
    ssr: false,
});

const imgCache: { [key: string]: HTMLImageElement } = {};
const iconCache: Record<string, HTMLImageElement> = {};

const groupColors: Record<number, string> = {
    1: "#64748b",
    2: "#10b981",
    3: "#a855f7",
    4: "#f97316",
    5: "#06b6d4",
};
const groupNames: Record<number, string> = {
    1: "No Group",
    2: "AI",
    3: "Finance",
    4: "Design",
    5: "Research",
};

/** Neon palette for tag-based clusters (cinematic, consistent per tag). */
const tagNeonPalette = [
    "#06b6d4", "#a855f7", "#f97316", "#10b981", "#ec4899",
    "#eab308", "#6366f1", "#14b8a6", "#f43f5e", "#8b5cf6",
];

function getColorForTag(tag: string): string {
    let h = 0;
    for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
    const idx = Math.abs(h) % tagNeonPalette.length;
    return tagNeonPalette[idx] ?? tagNeonPalette[0];
}

/** Deterministic hash from string for reproducible initial positions. */
function hashStr(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return (h % 1e6) / 1e6;
}

/** Legacy: derive numeric group (1-5) from node when group_id is not set. */
function getNodeGroup(node: any): number {
    if (node.group != null) {
        const g = typeof node.group === 'number' ? node.group : Number(node.group);
        if (Number.isFinite(g)) return g;
    }
    if (node.type === 'note') return 2;
    if (node.type === 'idea') return 3;
    return 1; // link or default
}

/** Cluster key for group mode: group_id (string) or legacy number. */
function getNodeGroupKey(node: any): string | number {
    if (node.group_id != null && typeof node.group_id === 'string') return node.group_id;
    return getNodeGroup(node);
}

/** Read graph theme from CSS variables (no re-render on theme switch). */
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

/** Hex to rgba with alpha for dimmed states. */
function hexToRgba(hex: string, alpha: number): string {
    if (!hex.startsWith('#')) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
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
    if (typeof key === 'string') return groupNamesById[key] ?? key;
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
        const label = clusterMode === 'group'
            ? getGroupLabel(key, groupNamesById)
            : `#${keyStr}`;
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

    // Конвертуємо компонент у рядок SVG
    // strokeWidth та size можна налаштувати тут
    const svgString = renderToStaticMarkup(
        <IconComponent color={color} size={32} strokeWidth={strokeWidth} />
    );

    const img = new Image();
    // Кодуємо SVG у Base64 для використання в src
    img.src = `data:image/svg+xml;base64,${btoa(svgString)}`;
    
    iconCache[cacheKey] = img;
    return img;
};

export interface GraphGroup {
    id: string;
    name: string;
    color: string;
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
}

function getLinkEnd(linkEnd: any): string | undefined {
    return typeof linkEnd === "string" ? linkEnd : linkEnd?.id;
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
    readOnly = false
}: GraphNetworkProps) {
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
    const containerRef = useRef<HTMLDivElement>(null);
    const fgRef = useRef<any>(null);
    const lastTransformRef = useRef<{ k: number; x: number; y: number } | null>(null);
    const prevNodeCountRef = useRef(0);

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
        const layoutRadius = 280;
        const nodesWithVal = workingNodes.map((node: any, index: number) => {
            const id = getNodeId(node);
            const degree = degreeMap[id] ?? 0;
            const val = Math.min(4 + degree * 1.5, 20);
            const g = getNodeGroup(node);
            const idStr = id != null ? String(id) : `i${index}`;
            const h = hashStr(idStr);
            const angle = h * 2 * Math.PI;
            const r = layoutRadius * (0.3 + 0.7 * (hashStr(idStr + "r") % 1));
            const x = r * Math.cos(angle);
            const y = r * Math.sin(angle);
            return { ...node, val, x: node.x ?? x, y: node.y ?? y };
        });
        const linksCopy = workingLinks.map((link: any) => ({ ...link }));
        if (pathfinderActive) {
            const pathSet = new Set(pathNodes);
            const dim: any[] = [];
            const bright: any[] = [];
            nodesWithVal.forEach((n: any) => {
                const id = getNodeId(n);
                if (pathSet.has(id)) bright.push(n);
                else dim.push(n);
            });
            return { nodes: [...dim, ...bright], links: linksCopy };
        }
        if (searchActive) {
            const dim: any[] = [];
            const bright: any[] = [];
            nodesWithVal.forEach((n: any) => {
                const id = getNodeId(n);
                if (highlightedSet.has(id)) bright.push(n);
                else dim.push(n);
            });
            return { nodes: [...dim, ...bright], links: linksCopy };
        }
        return { nodes: nodesWithVal, links: linksCopy };
    }, [graphData, searchActive, highlightedSet, pathfinderActive, pathNodes, timelineDate]);

    const getNodeIconUrl = useCallback((node: any) => {
        if (node.type === 'link' && node.url) {
            try {
                const domain = new URL(node.url).hostname;
                return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            } catch (e) {
                return `https://www.google.com/s2/favicons?domain=${node.url}&sz=64`;
            }
        }
        return null;
    }, []);

    const isLinkHidden = useCallback((link: any) => {
        const sId = typeof link.source === 'string' ? link.source : link.source?.id;
        const tId = typeof link.target === 'string' ? link.target : link.target?.id;

        // Solar System (Deep Focus): hide links where BOTH endpoints are outside the solar set
        if (solarSystemNodeId) {
            if (!solarNeighbors.has(sId) && !solarNeighbors.has(tId)) return true;
            return false;
        }

        // Pathfinder: show only path links; hide all others
        if (pathfinderActive) {
            return !isPathLink(link);
        }

        // 0. Neural Search: hide links that don't touch at least one highlighted node
        if (searchActive) {
            if (!highlightedSet.has(sId) && !highlightedSet.has(tId)) return true;
        }
        
        // 1. Zen Mode: ховаємо лінки, якщо жодна з нод не є центральною
        if (zenModeNodeId && sId !== zenModeNodeId && tId !== zenModeNodeId) {
            return true; 
        }

        // 2. Filter Tag: ховаємо лінки, якщо хоча б одна з нод не має потрібного тегу
        if (activeTag) {
            const sTags = typeof link.source === 'object' ? link.source.tags : graphData.nodes.find((n: any) => n.id === sId)?.tags;
            const tTags = typeof link.target === 'object' ? link.target.tags : graphData.nodes.find((n: any) => n.id === tId)?.tags;
            
            if (!sTags?.includes(activeTag) || !tTags?.includes(activeTag)) {
                return true;
            }
        }
        return false;
    }, [solarSystemNodeId, solarNeighbors, pathfinderActive, isPathLink, searchActive, highlightedSet, zenModeNodeId, activeTag, graphData.nodes]);

    const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const x = Number(node.x);
        const y = Number(node.y);
        if (!isFinite(x) || !isFinite(y)) return;

        const themeColors = getGraphThemeColors(containerRef.current);
        const idStr = typeof node.id === 'string' ? node.id : node.id?.id;
        const label = node.title ?? node.content ?? idStr ?? '';
        const rawSize = (node.val ?? 4) * 1;
        let size = Math.min(20, Math.max(6, rawSize));

        // Solar System (Deep Focus): top priority
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
            // Pathfinder mode overrides Zen and search
            const isPathNode = pathfinderActive && pathNodeSet.has(idStr);
            const pathStartId = pathNodes[0];
            const pathEndId = pathNodes.length > 0 ? pathNodes[pathNodes.length - 1] : null;
            const isPathStart = idStr === pathStartId;
            const isPathEnd = pathEndId != null && idStr === pathEndId;

            const isSearchHighlighted = !pathfinderActive && searchActive && highlightedSet.has(idStr);
            if (searchActive && !pathfinderActive) {
                if (isSearchHighlighted) size = Math.min(24, size * 1.2);
            }
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
                baseColor = isSearchHighlighted ? "#a855f7" : (getGroupColor(groupKey, groupColorsById) ?? groupColors[typeof groupKey === 'number' ? groupKey : 1] ?? "#ec4899");
            }
            strongGlow = (searchActive && highlightedSet.has(idStr)) || (pathfinderActive && pathNodeSet.has(idStr));
        }

        const strokeColor = isHidden
            ? (themeColors.nodeColor.startsWith('#') ? hexToRgba(themeColors.nodeColor, 0.12) : themeColors.nodeColor)
            : baseColor;

        // Neural Core context halo: pulsing semi-transparent ring (cyan/purple) when node is in context
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
            ctx.shadowColor = "rgba(168, 85, 247, 0.8)";
            ctx.shadowBlur = 20 / globalScale;
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(x, y, haloRadius + 2 / globalScale, 0, 2 * Math.PI);
            ctx.strokeStyle = `rgba(168, 85, 247, ${pulse * 0.5})`;
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
            ctx.restore();
        }

        // New-node ping: glowing circle behind the node that fades out over a few seconds
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
                gradient.addColorStop(0, `rgba(168, 85, 247, ${alpha * 0.5})`);
                gradient.addColorStop(0.6, `rgba(168, 85, 247, ${alpha * 0.2})`);
                gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
                ctx.fillStyle = gradient;
                ctx.fill();
                ctx.restore();
            }
        }

        // 2. Малюємо порожнє коло (Border)
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI, false);
        
        const innerFill = isHidden ? 'rgba(0, 0, 0, 0)' : (themeColors.nodeColor.startsWith('#') ? hexToRgba(themeColors.nodeColor, 0.18) : 'rgba(0, 0, 0, 0.2)');
        ctx.fillStyle = innerFill;
        ctx.fill();

        // Налаштування бордера (stronger glow for search/path/solar highlight)
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strongGlow ? 2.5 / globalScale : 2 / globalScale;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = strongGlow ? 18 / globalScale : 10 / globalScale;
        ctx.stroke();

        // 3. Малюємо іконку/емодзі всередині (якщо не приховано)
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
                    const iconSize = size * 1.2;
                    ctx.save();
                    ctx.beginPath();
                    // Кліпаємо коло трохи менше за бордер, щоб іконка не вилазила
                    ctx.arc(x, y, size * 0.8, 0, Math.PI * 2, true);
                    ctx.clip();
                    ctx.drawImage(img, x - iconSize/2, y - iconSize/2, iconSize, iconSize);
                    ctx.restore();
                }
            } else {
                let iconImg = null;
                if (node.type === 'idea') {
                    iconImg = createIconImage(Lightbulb, baseColor);
                } else if (node.type === 'note') {
                    iconImg = createIconImage(FileText, baseColor);
                }

                // Малюємо іконку, якщо вона завантажена
                if (iconImg && iconImg.complete) {
                    ctx.save();
                    // Додаємо легке світіння самій іконці
                    ctx.shadowColor = baseColor;
                    ctx.shadowBlur = 8 / globalScale;
                    
                    ctx.drawImage(
                        iconImg,
                        x - iconSize / 2,
                        y - iconSize / 2,
                        iconSize,
                        iconSize
                    );
                    ctx.restore();
                }
            }
        }

        // 4. Текст під нодою (theme-aware)
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
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: window.innerHeight,
            })
        }
    }, []);

    useEffect(() => {
        if (!fgRef.current) return;
        const fg = fgRef.current;
        const cx = dimensions.width / 2;
        const cy = dimensions.height / 2;
        const minDim = Math.min(dimensions.width, dimensions.height);
        const radius = minDim * 0.35;

        const getClusterKey = (node: any): string | number => {
            if (clusterMode === 'group') {
                return getNodeGroupKey(node);
            }
            return (node.tags && node.tags.length > 0 ? node.tags[0] : 'untagged') as string;
        };

        const rawKeys = [...new Set(processedData.nodes.map((n: any) => getClusterKey(n)))];
        const uniqueKeys = clusterMode === 'group'
            ? rawKeys.sort((a, b) => String(a).localeCompare(String(b)))
            : (rawKeys as string[]).sort((a, b) => String(a).localeCompare(String(b)));

        const clusterCenters: Record<string | number, { x: number; y: number }> = {};
        uniqueKeys.forEach((key, i) => {
            const angle = (i * 2 * Math.PI) / Math.max(1, uniqueKeys.length);
            clusterCenters[key] = {
                x: cx + radius * Math.cos(angle),
                y: cy + radius * Math.sin(angle),
            };
        });

        const getNodeIdStr = (node: any) => typeof node.id === 'string' ? node.id : node.id?.id;

        if (solarSystemNodeId && solarNeighbors.size > 0) {
            // Solar System mode: lock sun at center, neighbors on radial ring
            const centerNode = processedData.nodes.find(
                (n: any) => getNodeIdStr(n) === solarSystemNodeId
            );
            if (centerNode) {
                (centerNode as any).fx = cx;
                (centerNode as any).fy = cy;
            }
            fg.d3Force('x', null);
            fg.d3Force('y', null);
            fg.d3Force('radial', forceRadial(250, cx, cy).strength((node: any) =>
                solarNeighbors.has(getNodeIdStr(node)) ? 1 : 0
            ));
            fg.d3Force('collide', forceCollide(24).strength(1));
        } else {
            // Normal mode: clear all fx/fy so no node stays pinned
            processedData.nodes.forEach((node: any) => {
                delete (node as any).fx;
                delete (node as any).fy;
            });
            fg.d3Force('radial', null);
            fg.d3Force('collide', null);
            fg.d3Force('x', forceX((node: any) => clusterCenters[getClusterKey(node)]?.x ?? cx).strength(0.15));
            fg.d3Force('y', forceY((node: any) => clusterCenters[getClusterKey(node)]?.y ?? cy).strength(0.15));
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
    }, [physicsConfig, dimensions.width, dimensions.height, graphData.nodes, solarSystemNodeId, solarNeighbors, processedData.nodes, clusterMode]);

    useEffect(() => {
        if (!solarSystemNodeId || !fgRef.current) return;
        const cx = dimensions.width / 2;
        const cy = dimensions.height / 2;
        fgRef.current.centerAt(cx, cy, 800);
        fgRef.current.zoom(3, 800);
    }, [solarSystemNodeId, dimensions.width, dimensions.height]);

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
            const nx = Number(n.x);
            const ny = Number(n.y);
            if (isFinite(nx) && isFinite(ny)) {
                minX = Math.min(minX, nx);
                minY = Math.min(minY, ny);
                maxX = Math.max(maxX, nx);
                maxY = Math.max(maxY, ny);
            }
        });
        if (!isFinite(minX) || !isFinite(maxX)) return;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const boxW = maxX - minX + 2 * padding;
        const boxH = maxY - minY + 2 * padding;
        const k = Math.min(dimensions.width / boxW, dimensions.height / boxH, 4);
        fgRef.current.centerAt(centerX, centerY, 400);
        fgRef.current.zoom(k, 400);
    }, [contextNodeIds.length, contextNodeSet, processedData.nodes, dimensions.width, dimensions.height]);

    const handleZoom = useCallback((transform: { k: number; x: number; y: number }) => {
        lastTransformRef.current = { k: transform.k, x: transform.x, y: transform.y };
    }, []);

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

    useEffect(() => {
        if (timelineDate != null) return;
        const nodeCount = processedData.nodes.length;
        const prevCount = prevNodeCountRef.current;
        prevNodeCountRef.current = nodeCount;
        if (nodeCount > prevCount && prevCount > 0 && lastTransformRef.current && fgRef.current) {
            const { k, x, y } = lastTransformRef.current;
            const w = dimensions.width;
            const h = dimensions.height;
            const centerX = (w / 2 - x) / k;
            const centerY = (h / 2 - y) / k;
            const restore = () => {
                if (!fgRef.current || !isFinite(centerX) || !isFinite(centerY)) return;
                fgRef.current.centerAt(centerX, centerY, 0);
                fgRef.current.zoom(k, 0);
            };
            const t1 = setTimeout(restore, 100);
            const t2 = setTimeout(restore, 400);
            const t3 = setTimeout(restore, 800);
            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
                clearTimeout(t3);
            };
        }
    }, [processedData.nodes.length, dimensions.width, dimensions.height, timelineDate]);

    useEffect(() => {
        if (!fgRef.current || processedData.nodes.length === 0) return;
        const t = setTimeout(() => {
            fgRef.current?.d3ReheatSimulation();
        }, 50);
        return () => clearTimeout(t);
    }, [processedData.nodes.length]);

    useEffect(() => {
        if (lastTransformRef.current != null) return;
        const id = setTimeout(() => {
            if (fgRef.current) {
                const center = fgRef.current.centerAt();
                const zoom = fgRef.current.zoom();
                if (center && typeof zoom === 'number' && Number.isFinite(center.x) && Number.isFinite(center.y)) {
                    const w = dimensions.width;
                    const h = dimensions.height;
                    lastTransformRef.current = {
                        k: zoom,
                        x: w / 2 - center.x * zoom,
                        y: h / 2 - center.y * zoom,
                    };
                }
            }
        }, 600);
        return () => clearTimeout(id);
    }, [processedData.nodes.length, dimensions.width, dimensions.height]);

    return (
        <div 
            ref={containerRef} 
            className="w-full h-screen"
            style={{ backgroundColor: 'var(--graph-bg)' }}
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
        >
            <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={processedData}
                nodeVal={(node: any) => node.val ?? 4}
                nodeLabel={(node: any) => node.title ?? node.content ?? (typeof node.id === 'string' ? node.id : node.id?.id) ?? ''}
                nodeCanvasObject={drawNode}
                onRenderFramePre={handleRenderFramePre}
                onZoom={handleZoom}
                warmupTicks={100}
                d3AlphaDecay={0.0228}
                d3VelocityDecay={0.4}                
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
                onBackgroundClick={() => {
                    if (onBackgroundClick) onBackgroundClick();
                }}
                onLinkHover={(link) => setHoveredLink(link)}
                
                nodePointerAreaPaint={(node: any, color, ctx) => {
                    const x = node.x ?? 0;
                    const y = node.y ?? 0;
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
                        if (highlightedSet.has(nodeId)) return "#a855f7";
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
                    return pathfinderActive ? theme.nodeColor : theme.nodeColor;
                }}
                linkColor={(link: any) => {
                    const theme = getGraphThemeColors(containerRef.current);
                    if (isLinkHidden(link)) return "rgba(0,0,0,0)";
                    if (solarSystemNodeId) return "rgba(251, 191, 36, 0.9)";
                    if (pathfinderActive && isPathLink(link)) return "rgba(6, 182, 212, 0.8)";
                    if (pathfinderActive) return "rgba(0,0,0,0)";
                    if (link === hoveredLink) return link.relationType === 'ai' ? "#a855f7" : theme.nodeColor;
                    return link.relationType === 'ai' ? "rgba(168, 85, 247, 0.4)" : theme.linkColor;
                }}
                backgroundColor="transparent"
                enablePointerInteraction={true}
            />
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
                                <><Sparkles size={12} className="text-indigo-600 dark:text-purple-400" /> <span className="text-indigo-600 dark:text-purple-400">AI Connection</span></>
                            ) : (
                                <><LinkIcon size={12} className="text-neutral-500 dark:text-neutral-400" /> <span className="text-neutral-600 dark:text-neutral-400">Logical connection</span></>
                            )}
                        </div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{hoveredLink.label || "Communication"}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}