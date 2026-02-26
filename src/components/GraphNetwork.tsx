/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from 'next/dynamic';
import { forceManyBody, forceX, forceY } from 'd3-force';
import { AnimatePresence, motion } from "framer-motion";
import { LinkIcon, Sparkles } from "lucide-react";

const ForceGraph2D = dynamic(() => import ('react-force-graph-2d'), {
    ssr: false,
});

const imgCache: { [key: string]: HTMLImageElement } = {};

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

    const getNodeIconUrl = (node: any) => {
        if (node.type === 'link') {
            return `https://www.google.com/s2/favicons?domain=${node.id.toLowerCase()}.com&sz=64`;
        }
        return null; 
    };

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
        const idStr = typeof node.id === 'string' ? node.id : node.id?.id;
        const label = idStr;
        const size = 8; 
        
        // 🔥 ПРАВИЛЬНА перевірка: чи є ID ноди в нашому Set-і сусідів
        const isZenHidden = zenModeNodeId && !zenModeNeighbors.has(idStr);
        const isTagHidden = activeTag && (!node.tags || !node.tags.includes(activeTag));
        
        const isHidden = isZenHidden || isTagHidden;

        // 2. Main circle (background)
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
        
        const colors: any = { 1: "#3b82f6", 2: "#10b981", 3: "#a855f7", 4: "#f97316", 5: "#06b6d4" };
        ctx.fillStyle = isHidden ? 'rgba(30, 30, 30, 0.1)' : (colors[node.group] || "#ec4899");
        ctx.fill();

        // 3. Draw icon/image
        const iconUrl = getNodeIconUrl(node);
        if (iconUrl && !isHidden) {
            if (!imgCache[iconUrl]) {
                const img = new Image();
                img.src = iconUrl;
                img.onload = () => { imgCache[iconUrl] = img; };
            } else {
                const img = imgCache[iconUrl];
                const iconSize = size * 1.2;
                ctx.save();
                ctx.beginPath();
                ctx.arc(node.x, node.y, size * 0.8, 0, Math.PI * 2, true);
                ctx.clip(); 
                ctx.drawImage(img, node.x - iconSize/2, node.y - iconSize/2, iconSize, iconSize);
                ctx.restore();
            }
        } else if (node.type === 'idea' && !isHidden) {
            ctx.font = `${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💡', node.x, node.y);
        } else if (node.type === 'note' && !isHidden) {
            ctx.font = `${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('📝', node.x, node.y);
        }

        // 4. Text under node
        if (globalScale > 1.5) {
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = isHidden ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(label, node.x, node.y + size + 2);
        }
    }, [zenModeNodeId, activeTag, zenModeNeighbors, getNodeIconUrl]);
    
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

            fg.d3Force('charge', forceManyBody().strength(-physicsConfig.repulsion));

            fg.d3Force('center', null); // вимикаємо стандартний center
            fg.d3Force('x', forceX(cx).strength(0.08));
            fg.d3Force('y', forceY(cy).strength(0.08));

            // Дистанція зв'язків
            const linkForce = fg.d3Force('link');
            if (linkForce) {
                linkForce.distance(physicsConfig.linkDistance);
            }

            fg.d3ReheatSimulation();
        }
    }, [physicsConfig, dimensions.width, dimensions.height]);

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
                graphData={graphData}
                nodeLabel="id"
                
                nodeCanvasObject={drawNode}
                warmupTicks={100}                
                onNodeClick={(node: any) => {
                    if (fgRef.current) {
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
                    // Важливо для того, щоб кліки продовжували працювати
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(node.x ?? 0, node.y ?? 0, 8, 0, 2 * Math.PI, false);
                    ctx.fill();
                }}
                nodeColor={(node: any) => {
                    const nodeId = typeof node.id === 'string' ? node.id : node.id?.id;
                    if (zenModeNodeId && !zenModeNeighbors.has(nodeId)) return "rgba(30, 30, 30, 0.1)"; 
                    if (activeTag && (!node.tags || !node.tags.includes(activeTag))) return "rgba(50, 50, 50, 0.2)"; 
                    if (nodeId === focusedNodeId) return "#fbbf24"; 
                    if (node.group === 1) return "#3b82f6"; 
                    if (node.group === 2) return "#10b981"; 
                    if (node.group === 3) return "#a855f7";
                    if (node.group === 4) return "#f97316";
                    if (node.group === 5) return "#06b6d4";
                    return "#ec4899";
                }}
                linkWidth={(link: any) => (link === hoveredLink ? 2 : link.weight || 1)}
                linkDirectionalParticles={(link: any) => {
                    if (isLinkHidden(link)) return 0; // Немає частинок!
                    return link.relationType === 'ai' ? 3 : 0;
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