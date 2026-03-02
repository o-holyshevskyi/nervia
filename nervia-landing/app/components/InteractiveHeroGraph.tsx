"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { forceManyBody } from "d3-force";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const BRAND = {
  cyan: "#06b6d4",
  purple: "#a855f7",
  emerald: "#10b981",
};

/** Dark-mode graph theme (matches GraphNetwork styling). */
const THEME = {
  nodeColor: "#e2e8f0",
  linkColor: "rgba(148, 163, 184, 0.5)",
};

function hexToRgba(hex: string, alpha: number): string {
  if (!hex.startsWith("#")) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

type NodeId = string;
interface Node {
  id: NodeId;
  name: string;
  val?: number;
  color?: string;
  x?: number;
  y?: number;
}
interface Link {
  source: NodeId;
  target: NodeId;
}

function buildGraphData(): { nodes: Node[]; links: Link[] } {
  const nodes: Node[] = [
    { id: "center", name: "Nervia Exocortex", val: 14, color: BRAND.cyan },
    { id: "neural", name: "Neural Core (AI)", val: 8, color: BRAND.purple },
    { id: "graph3d", name: "3D Graph", val: 7, color: BRAND.cyan },
    { id: "clusters", name: "Auto-Clusters", val: 7, color: BRAND.emerald },
    { id: "knowledge", name: "Knowledge Base", val: 7, color: BRAND.cyan },
    { id: "ideas", name: "Ideas", val: 6, color: BRAND.purple },
    { id: "research", name: "Research", val: 6, color: BRAND.emerald },
    { id: "telemetry", name: "Telemetry", val: 6, color: BRAND.cyan },
    { id: "projectx", name: "Project X", val: 4, color: BRAND.purple },
    { id: "meeting", name: "Meeting Notes", val: 4, color: BRAND.cyan },
    { id: "brainstorm", name: "Brainstorm", val: 4, color: BRAND.emerald },
    { id: "sources", name: "Sources", val: 5, color: BRAND.cyan },
    { id: "tags", name: "Tags", val: 5, color: BRAND.purple },
  ];
  const links: Link[] = [
    { source: "center", target: "neural" },
    { source: "center", target: "graph3d" },
    { source: "center", target: "clusters" },
    { source: "center", target: "knowledge" },
    { source: "center", target: "ideas" },
    { source: "center", target: "research" },
    { source: "center", target: "telemetry" },
    { source: "research", target: "projectx" },
    { source: "research", target: "meeting" },
    { source: "ideas", target: "brainstorm" },
    { source: "ideas", target: "meeting" },
    { source: "knowledge", target: "sources" },
    { source: "knowledge", target: "tags" },
    { source: "neural", target: "clusters" },
    { source: "graph3d", target: "telemetry" },
  ];
  return { nodes, links };
}

const graphData = buildGraphData();

export function InteractiveHeroGraph() {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 360 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setDimensions({ width: el.offsetWidth, height: el.offsetHeight });
    });
    ro.observe(el);
    setDimensions({ width: el.offsetWidth, height: el.offsetHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force("charge", forceManyBody().strength(-200));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const fg = fgRef.current;
      if (fg && typeof fg.zoomToFit === "function") {
        fg.zoomToFit(400, 50);
      } else if (fg && typeof fg.centerAt === "function" && typeof fg.zoom === "function") {
        fg.centerAt(0, 0, 400);
        fg.zoom(1.2, 400);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [dimensions.width, dimensions.height]);

  const drawNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const x = Number(node.x);
      const y = Number(node.y);
      if (!isFinite(x) || !isFinite(y)) return;
      const label = node.name ?? "";
      const val = node.val ?? 5;
      const baseColor = node.color ?? BRAND.cyan;
      const size = Math.min(20, Math.max(6, val));
      const isCenter = node.id === "center";
      const strongGlow = isCenter;

      // Inner fill (hollow circle, same as GraphNetwork)
      const innerFill = hexToRgba(THEME.nodeColor, 0.18);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI, false);
      ctx.fillStyle = innerFill;
      ctx.fill();

      // Border with neon glow (same as GraphNetwork)
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = strongGlow ? 2.5 / globalScale : 2 / globalScale;
      ctx.shadowColor = baseColor;
      ctx.shadowBlur = strongGlow ? 18 / globalScale : 10 / globalScale;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Label below node (same font/position as GraphNetwork)
      if (label && globalScale > 1.5) {
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = THEME.nodeColor;
        ctx.fillText(label, x, y + size + 4);
      }
    },
    []
  );

  const drawLink = useCallback(
    (link: any, ctx: CanvasRenderingContext2D) => {
      const source = link.source;
      const target = link.target;
      const sx = typeof source.x === "number" ? source.x : 0;
      const sy = typeof source.y === "number" ? source.y : 0;
      const tx = typeof target.x === "number" ? target.x : 0;
      const ty = typeof target.y === "number" ? target.y : 0;
      ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    },
    []
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video md:h-[500px] max-w-5xl mx-auto rounded-2xl overflow-hidden backdrop-blur-xl bg-white/[0.02] border border-white/10 shadow-[0_0_80px_rgba(168,85,247,0.1)] pointer-events-auto"
      style={{
        boxShadow:
          "0 0 60px rgba(6,182,212,0.08), 0 0 80px rgba(168,85,247,0.1), inset 0 0 0 1px rgba(255,255,255,0.05)",
      }}
    >
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="transparent"
        nodeCanvasObject={drawNode}
        linkCanvasObject={drawLink}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.008}
        linkDirectionalParticleWidth={3}
        linkDirectionalParticleColor={() => BRAND.cyan}
        enableNodeDrag={true}
        enableZoomInteraction={false}
        enablePanInteraction={false}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        warmupTicks={80}
        cooldownTicks={0}
      />
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background:
            "linear-gradient(to top, rgba(2,6,23,0.7) 0%, transparent 40%, transparent 60%, rgba(2,6,23,0.4) 100%)",
        }}
      />
    </div>
  );
}
