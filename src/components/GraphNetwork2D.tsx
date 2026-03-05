/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { forwardRef, type MutableRefObject } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export interface GraphNetwork2DProps {
    width: number;
    height: number;
    graphData: { nodes: any[]; links: any[] };
    nodeVal: (node: any) => number;
    nodeLabel: (node: any) => string;
    nodeCanvasObject: (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => void;
    onRenderFramePre: (ctx: CanvasRenderingContext2D, globalScale: number) => void;
    onZoom: (transform: { k: number; x: number; y: number }) => void;
    warmupTicks: number;
    d3AlphaDecay: number;
    d3VelocityDecay: number;
    onNodeClick: (node: any) => void;
    onNodeRightClick: (node: any, event: unknown) => void;
    onBackgroundClick: () => void;
    onLinkHover: (link: any) => void;
    nodePointerAreaPaint: (node: any, color: string, ctx: CanvasRenderingContext2D) => void;
    nodeColor: (node: any) => string;
    linkWidth: (link: any) => number;
    linkDirectionalParticles: (link: any) => number;
    linkDirectionalParticleSpeed: number;
    linkDirectionalParticleWidth: number;
    linkDirectionalParticleColor: () => string;
    linkColor: (link: any) => string;
    backgroundColor: string;
    enablePointerInteraction: boolean;
    /** Called once the d3 simulation has initialised and the engine is running. Use this to apply d3 forces after mount. */
    onEngineStop?: () => void;
    d3AlphaMin: number;
}

/**
 * 2D force-directed graph. Isolated from 3D so that 2D behavior is not affected by 3D-specific fixes.
 */
const GraphNetwork2D = forwardRef<any, GraphNetwork2DProps>(function GraphNetwork2D(
    {
        width,
        height,
        graphData,
        nodeVal,
        nodeLabel,
        nodeCanvasObject,
        onRenderFramePre,
        onZoom,
        warmupTicks,
        d3AlphaDecay,
        d3VelocityDecay,
        onNodeClick,
        onNodeRightClick,
        onBackgroundClick,
        onLinkHover,
        nodePointerAreaPaint,
        nodeColor,
        linkWidth,
        linkDirectionalParticles,
        linkDirectionalParticleSpeed,
        linkDirectionalParticleWidth,
        linkDirectionalParticleColor,
        linkColor,
        backgroundColor,
        enablePointerInteraction,
        onEngineStop,
        d3AlphaMin,
    },
    ref
) {
    return (
        <ForceGraph2D
            ref={ref == null ? undefined : (ref as MutableRefObject<any>)}
            width={width}
            height={height}
            graphData={graphData}
            nodeVal={nodeVal}
            nodeLabel={nodeLabel}
            nodeCanvasObject={nodeCanvasObject}
            onRenderFramePre={onRenderFramePre}
            onZoom={onZoom}
            warmupTicks={warmupTicks}
            d3AlphaDecay={d3AlphaDecay}
            d3VelocityDecay={d3VelocityDecay}
            onNodeClick={onNodeClick}
            onNodeRightClick={onNodeRightClick}
            onBackgroundClick={onBackgroundClick}
            onLinkHover={onLinkHover}
            nodePointerAreaPaint={nodePointerAreaPaint}
            nodeColor={nodeColor}
            linkWidth={linkWidth}
            linkDirectionalParticles={linkDirectionalParticles}
            linkDirectionalParticleSpeed={linkDirectionalParticleSpeed}
            linkDirectionalParticleWidth={linkDirectionalParticleWidth}
            linkDirectionalParticleColor={linkDirectionalParticleColor}
            linkColor={linkColor}
            backgroundColor={backgroundColor}
            enablePointerInteraction={enablePointerInteraction}
            onEngineStop={onEngineStop}
            d3AlphaMin={d3AlphaMin}
        />
    );
});

export default GraphNetwork2D;