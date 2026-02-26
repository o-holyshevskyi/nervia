/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from 'next/dynamic';
import { forceManyBody, forceX, forceY } from 'd3-force';
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Lightbulb, LinkIcon, Sparkles } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

const ForceGraph2D = dynamic(() => import ('react-force-graph-2d'), {
    ssr: false,
});

const imgCache: { [key: string]: HTMLImageElement } = {};
const iconCache: Record<string, HTMLImageElement> = {};

const groupColors: Record<number, string> = {
    1: "#3b82f6",
    2: "#10b981",
    3: "#a855f7",
    4: "#f97316",
    5: "#06b6d4",
};
const groupNames: Record<number, string> = {
    1: "Development",
    2: "AI",
    3: "Finance",
    4: "Design",
    5: "Research",
};

/** Deterministic hash from string for reproducible initial positions. */
function hashStr(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return (h % 1e6) / 1e6;
}

/** Derive stable group from node data so colors are always based on group/type, not insertion order. */
function getNodeGroup(node: any): number {
    if (node.group != null) {
        const g = typeof node.group === 'number' ? node.group : Number(node.group);
        if (Number.isFinite(g)) return g;
    }
    if (node.type === 'note') return 2;
    if (node.type === 'idea') return 3;
    return 1; // link or default
}

function drawGroupAreas(
    ctx: CanvasRenderingContext2D,
    nodes: any[],
    dimensions: { width: number; height: number },
    _globalScale: number,
    nodeIdToGroup: Map<string | number, number>
) {
    const byGroup: Record<number, { x: number; y: number }[]> = {};
    for (const node of nodes) {
        const nodeId = typeof node.id === 'string' ? node.id : node?.id;
        const g = nodeId != null ? (nodeIdToGroup.get(nodeId) ?? getNodeGroup(node)) : getNodeGroup(node);
        if (g == null) continue;
        const x = Number(node.x);
        const y = Number(node.y);
        if (!isFinite(x) || !isFinite(y)) continue;
        if (!byGroup[g]) byGroup[g] = [];
        byGroup[g].push({ x, y });
    }

    const prevComposite = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = "screen";

    for (const g of Object.keys(byGroup).map(Number)) {
        const points = byGroup[g];
        if (!points?.length) continue;
        const centerX = points.reduce((a, p) => a + p.x, 0) / points.length;
        const centerY = points.reduce((a, p) => a + p.y, 0) / points.length;
        if (!isFinite(centerX) || !isFinite(centerY)) continue;

        const maxDist = points.reduce((max, p) => Math.max(max, Math.hypot(p.x - centerX, p.y - centerY)), 0);
        const radius = Math.min(dimensions.width + dimensions.height, Math.max(80, maxDist * 1.2));
        if (!isFinite(radius) || radius <= 0) continue;

        const color = groupColors[g];
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

    for (const g of Object.keys(byGroup).map(Number)) {
        const points = byGroup[g];
        if (!points?.length) continue;
        const centerX = points.reduce((a, p) => a + p.x, 0) / points.length;
        const centerY = points.reduce((a, p) => a + p.y, 0) / points.length;
        if (!isFinite(centerX) || !isFinite(centerY)) continue;
        const label = groupNames[g] ?? `Group ${g}`;
        ctx.font = "600 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 4;
        ctx.fillStyle = "rgba(255,255,255,0.25)";
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

interface GraphNetworkProps {
    graphData: { nodes: any[]; links: any[] };
    activeTag: string | null;
    focusedNodeId: string | null;
    zenModeNodeId: string | null;
    physicsConfig: { repulsion: number; linkDistance: number };
    onNodeSelect: (node: any) => void;
    onNodeContextMenu?: (node: any, event: MouseEvent) => void; 
    onBackgroundClick?: () => void;
}

export default function GraphNetwork({ 
    onNodeSelect, 
    onBackgroundClick, 
    onNodeContextMenu, 
    graphData, 
    activeTag, 
    focusedNodeId, 
    zenModeNodeId,
    physicsConfig
}: GraphNetworkProps) {
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
    const containerRef = useRef<HTMLDivElement>(null);
    const fgRef = useRef<any>(null);
    const lastTransformRef = useRef<{ k: number; x: number; y: number } | null>(null);
    const prevNodeCountRef = useRef(0);

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

    const nodeIdToGroupMap = useMemo(() => {
        const m = new Map<string | number, number>();
        graphData.nodes.forEach((n: any) => {
            const id = typeof n.id === 'string' ? n.id : n?.id;
            if (id != null) m.set(id, getNodeGroup(n));
        });
        return m;
    }, [graphData.nodes]);

    const processedData = useMemo(() => {
        const { nodes, links } = graphData;
        const degreeMap: Record<string, number> = {};
        const getNodeId = (n: any) => (typeof n === 'string' ? n : n?.id);
        links.forEach((link: any) => {
            const sId = getNodeId(link.source);
            const tId = getNodeId(link.target);
            if (sId != null) degreeMap[sId] = (degreeMap[sId] ?? 0) + 1;
            if (tId != null && tId !== sId) degreeMap[tId] = (degreeMap[tId] ?? 0) + 1;
        });
        const layoutRadius = 280;
        const nodesWithVal = nodes.map((node: any, index: number) => {
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
        const linksCopy = links.map((link: any) => ({ ...link }));
        return { nodes: nodesWithVal, links: linksCopy };
    }, [graphData]);

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
    }, [zenModeNodeId, activeTag, graphData.nodes]);

    const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const x = Number(node.x);
        const y = Number(node.y);
        if (!isFinite(x) || !isFinite(y)) return;

        const idStr = typeof node.id === 'string' ? node.id : node.id?.id;
        const label = idStr;
        const rawSize = (node.val ?? 4) * 1;
        const size = Math.min(20, Math.max(6, rawSize));

        // 1. Визначаємо стан прихованості
        const isZenHidden = zenModeNodeId && !zenModeNeighbors.has(idStr);
        const isTagHidden = activeTag && (!node.tags || !node.tags.includes(activeTag));
        const isHidden = isZenHidden || isTagHidden;

        // Визначаємо колір залежно від групи (по id з канонічної мапи, щоб не залежати від мутацій бібліотеки)
        const group = nodeIdToGroupMap.get(idStr) ?? getNodeGroup(node);
        const baseColor = groupColors[group] ?? "#ec4899";

        // Колір для контуру та тексту
        const strokeColor = isHidden ? 'rgba(100, 100, 100, 0.1)' : baseColor;

        // 2. Малюємо порожнє коло (Border)
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI, false);
        
        // Внутрішня частина (прозора або ледь помітна заливка)
        ctx.fillStyle = isHidden ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.2)'; 
        ctx.fill();

        // Налаштування бордера
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2 / globalScale; // Товщина рамки адаптується до зуму
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 10 / globalScale;
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

        // 4. Текст під нодою
        if (globalScale > 1.5) {
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = isHidden ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(label, x, y + size + 4);
        }
    }, [zenModeNodeId, activeTag, zenModeNeighbors, getNodeIconUrl, nodeIdToGroupMap]);

    const handleRenderFramePre = useCallback(
        (ctx: CanvasRenderingContext2D, globalScale: number) => {
            drawGroupAreas(ctx, processedData.nodes, dimensions, globalScale, nodeIdToGroupMap);
        },
        [processedData.nodes, dimensions, nodeIdToGroupMap]
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
        if (fgRef.current) {
            const fg = fgRef.current;
            const cx = dimensions.width / 2;
            const cy = dimensions.height / 2;
            const minDim = Math.min(dimensions.width, dimensions.height);
            const radius = minDim * 0.35;

            const groupIds = [...new Set(graphData.nodes.map((n: any) => getNodeGroup(n)))].sort((a, b) => a - b);
            const clusterCenters: Record<number, { x: number; y: number }> = {};
            groupIds.forEach((g, i) => {
                const angle = (i / Math.max(1, groupIds.length)) * 2 * Math.PI;
                clusterCenters[g] = {
                    x: cx + radius * Math.cos(angle),
                    y: cy + radius * Math.sin(angle),
                };
            });

            const nodeIdToGroup = new Map<string | number, number>();
            graphData.nodes.forEach((n: any) => {
                const id = typeof n.id === 'string' ? n.id : n?.id;
                if (id != null) nodeIdToGroup.set(id, getNodeGroup(n));
            });

            fg.d3Force('charge', forceManyBody().strength(-physicsConfig.repulsion));

            const getGroupForNode = (node: any) => {
                const id = typeof node.id === 'string' ? node.id : node?.id;
                return id != null ? (nodeIdToGroup.get(id) ?? getNodeGroup(node)) : getNodeGroup(node);
            };
            fg.d3Force('center', null);
            fg.d3Force('x', forceX((node: any) => clusterCenters[getGroupForNode(node)]?.x ?? cx).strength(0.08));
            fg.d3Force('y', forceY((node: any) => clusterCenters[getGroupForNode(node)]?.y ?? cy).strength(0.08));

            const linkForce = fg.d3Force('link');
            if (linkForce) {
                linkForce.distance(physicsConfig.linkDistance);
                linkForce.strength((link: any) => {
                    const s = typeof link.source === 'object' ? getGroupForNode(link.source) : nodeIdToGroup.get(link.source);
                    const t = typeof link.target === 'object' ? getGroupForNode(link.target) : nodeIdToGroup.get(link.target);
                    return s !== undefined && t !== undefined && s === t ? 0.7 : 0.1;
                });
            }

            fg.d3ReheatSimulation();
        }
    }, [physicsConfig, dimensions.width, dimensions.height, graphData.nodes]);

    const handleZoom = useCallback((transform: { k: number; x: number; y: number }) => {
        lastTransformRef.current = { k: transform.k, x: transform.x, y: transform.y };
    }, []);

    useEffect(() => {
        const nodeCount = processedData.nodes.length;
        const prevCount = prevNodeCountRef.current;
        prevNodeCountRef.current = nodeCount;
        if (nodeCount > prevCount && prevCount > 0 && lastTransformRef.current && fgRef.current) {
            const { k, x, y } = lastTransformRef.current;
            const w = dimensions.width;
            const h = dimensions.height;
            const centerX = (w / 2 - x) / k;
            const centerY = (h / 2 - y) / k;
            const fg = fgRef.current;
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
    }, [processedData.nodes.length, dimensions.width, dimensions.height]);

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
            className="w-full h-screen bg-neutral-950" 
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
        >
            <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={processedData}
                nodeVal={(node: any) => node.val ?? 4}
                nodeLabel="id"
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
                    onNodeSelect(node);
                }}
                onNodeRightClick={(node, event) => {
                    if (onNodeContextMenu) onNodeContextMenu(node, event as unknown as MouseEvent);
                }}
                onBackgroundClick={() => {
                    if (onBackgroundClick) onBackgroundClick();
                }}
                onLinkHover={(link) => setHoveredLink(link)}
                
                nodePointerAreaPaint={(node, color, ctx) => {
                    const x = node.x ?? 0;
                    const y = node.y ?? 0;
                    if (!isFinite(x) || !isFinite(y)) return;
                    const rawSize = (node.val ?? 4) * 1;
                    const radius = Math.min(20, Math.max(6, rawSize));
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
                    ctx.fill();
                }}
                nodeColor={(node: any) => {
                    const nodeId = typeof node.id === 'string' ? node.id : node.id?.id;
                    if (zenModeNodeId && !zenModeNeighbors.has(nodeId)) return "rgba(30, 30, 30, 0.1)"; 
                    if (activeTag && (!node.tags || !node.tags.includes(activeTag))) return "rgba(50, 50, 50, 0.2)"; 
                    if (nodeId === focusedNodeId) return "#fbbf24"; 
                    const group = nodeIdToGroupMap.get(nodeId) ?? getNodeGroup(node);
                    return groupColors[group] ?? "#ec4899";
                }}
                linkWidth={(link: any) => (link === hoveredLink ? 2 : link.weight || 1)}
                linkDirectionalParticles={(link: any) => {
                    if (isLinkHidden(link)) return 0; // Немає частинок!
                    return link.relationType === 'ai' ? physicsConfig.linkDistance / 20 : 0;
                }}
                linkDirectionalParticleSpeed={0.005}
                linkDirectionalParticleWidth={4}
                linkDirectionalParticleColor={() => "#fafafa"}
                linkColor={(link: any) => {
                    if (isLinkHidden(link)) return "rgba(0,0,0,0)";
                    
                    if (link === hoveredLink) return link.relationType === 'ai' ? "#a855f7" : "#ffffff";
                    return link.relationType === 'ai' ? "rgba(168, 85, 247, 0.4)" : "rgba(255, 255, 255, 0.15)";
                }}
                backgroundColor="#0a0a0a"
                enablePointerInteraction={true}
            />
            <AnimatePresence>
                {hoveredLink && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute z-50 pointer-events-none bg-neutral-900/80 backdrop-blur-md border border-white/10 px-4 py-3 rounded-xl shadow-2xl flex flex-col gap-1 min-w-[200px]"
                        style={{ left: mousePos.x + 15, top: mousePos.y + 15 }}
                    >
                        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-1">
                            {hoveredLink.relationType === 'ai' ? (
                                <><Sparkles size={12} className="text-purple-400" /> <span className="text-purple-400">AI Connection</span></>
                            ) : (
                                <><LinkIcon size={12} className="text-neutral-400" /> <span className="text-neutral-400">Logical connection</span></>
                            )}
                        </div>
                        <p className="text-sm font-medium text-white">{hoveredLink.label || "Communication"}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}