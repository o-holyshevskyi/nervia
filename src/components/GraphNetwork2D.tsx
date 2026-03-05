/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { forwardRef, type MutableRefObject, useState, useCallback, useRef, useMemo } from 'react';
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
    onEngineStop?: () => void;
    d3AlphaMin: number;
    graphTheme: { nodeColor: string; linkColor: string; graphBg: string };
}

const GraphNetwork2D = forwardRef<any, GraphNetwork2DProps>(function GraphNetwork2D(
    props,
    ref
) {
    const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
    // Зберігаємо стан світіння (glow) кожної крапки для ефекту "хвоста", що згасає
    const glowState = useRef<Map<string, number>>(new Map());

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const handleMouseLeave = () => {
        setMousePos({ x: -1000, y: -1000 });
    };

    const isLightTheme = useMemo(() => {
        const bg = props.graphTheme.graphBg?.trim() || '#000000';
        
        // Handle #hex
        if (bg.startsWith('#')) {
            const hex = bg.replace('#', '');
            const r = parseInt(hex.length === 3 ? hex[0]+hex[0] : hex.slice(0, 2), 16);
            const g = parseInt(hex.length === 3 ? hex[1]+hex[1] : hex.slice(2, 4), 16);
            const b = parseInt(hex.length === 3 ? hex[2]+hex[2] : hex.slice(4, 6), 16);
            return (r * 0.299 + g * 0.587 + b * 0.114) / 255 > 0.5;
        }
        
        // Handle rgb() or rgba()
        if (bg.startsWith('rgb')) {
            const match = bg.match(/\d+/g);
            if (match && match.length >= 3) {
                return (parseInt(match[0]) * 0.299 + parseInt(match[1]) * 0.587 + parseInt(match[2]) * 0.114) / 255 > 0.5;
            }
        }
        
        return false;
    }, [props.graphTheme.graphBg]);

    // Перехоплюємо рендер до того, як намалюються ноди, щоб покласти сітку на фон
    const handleRenderFramePre = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
        const fg = (ref as MutableRefObject<any>)?.current;
        let mouseWorld = { x: -999999, y: -999999 };

        if (fg && mousePos.x !== -1000) {
            try {
                mouseWorld = fg.screen2GraphCoords(mousePos.x, mousePos.y);
            } catch (e) {}
        }

        const transform = fg?.zoomTransform?.() || { k: globalScale, x: 0, y: 0 };
        
        const halfW = props.width / 2;
        const halfH = props.height / 2;

        const startX = (-halfW - transform.x) / transform.k;
        const endX = (halfW - transform.x) / transform.k;
        const startY = (-halfH - transform.y) / transform.k;
        const endY = (halfH - transform.y) / transform.k;

        // 🔥 ОПТИМІЗАЦІЯ 1: Адаптивний крок сітки (LOD)
        let S = 40; 
        // Зберігаємо мінімум 15 пікселів візуальної відстані між крапками на екрані
        while (S * transform.k < 15) {
            S *= 2; 
        }

        const pad = S; 
        const minX = Math.floor((startX - pad) / S) * S;
        const maxX = Math.ceil((endX + pad) / S) * S;
        const minY = Math.floor((startY - pad) / S) * S;
        const maxY = Math.ceil((endY + pad) / S) * S;

        // 🔥 ОПТИМІЗАЦІЯ 2: Запобіжник (якщо якимось дивом точок більше 15000 - відключаємо сітку)
        const cols = (maxX - minX) / S;
        const rows = (maxY - minY) / S;
        if (cols * rows > 15000) {
            if (props.onRenderFramePre) props.onRenderFramePre(ctx, globalScale);
            return;
        }

        const baseColor = isLightTheme ? 'rgba(20, 20, 20, 0.10)' : 'rgba(255, 255, 255, 0.10)';
        const hoverRadiusSq = (40 / transform.k) * (40 / transform.k);
        
        // Розмір статичної крапки (адаптується до зуму, щоб завжди бути ~1.5px на екрані)
        const baseDotSize = 1.5 / transform.k;

        const currentGlows = glowState.current;
        const newGlows = new Map<string, number>();

        ctx.save();
        
        // Малюємо базову сітку
        ctx.beginPath();
        ctx.fillStyle = baseColor;
        
        for (let x = minX; x <= maxX; x += S) {
            for (let y = minY; y <= maxY; y += S) {
                const dx = x - mouseWorld.x;
                const dy = y - mouseWorld.y;
                const distSq = dx * dx + dy * dy;
                
                const key = `${x},${y}`;
                let glow = currentGlows.get(key) || 0;

                if (distSq < hoverRadiusSq) {
                    glow = Math.min(1, glow + 0.15);
                } else {
                    glow = Math.max(0, glow - 0.03);
                }

                if (glow > 0) {
                    newGlows.set(key, glow);
                } else {
                    // 🔥 ОПТИМІЗАЦІЯ 3: Використовуємо rect замість arc (набагато швидше!)
                    ctx.rect(x - baseDotSize/2, y - baseDotSize/2, baseDotSize, baseDotSize);
                }
            }
        }
        ctx.fill();

        // Малюємо крапки, що світяться (другим шаром)
        if (newGlows.size > 0) {
            ctx.beginPath();
            for (const [key, glow] of newGlows.entries()) {
                const [xStr, yStr] = key.split(',');
                const x = parseFloat(xStr);
                const y = parseFloat(yStr);

                const glowSize = (1.5 + glow * 2.5) / transform.k;
                ctx.fillStyle = `rgba(168, 85, 247, ${glow * 0.8})`; 
                ctx.rect(x - glowSize/2, y - glowSize/2, glowSize, glowSize);
            }
            ctx.fill();
        }
        glowState.current = newGlows;

        ctx.restore();

        if (props.onRenderFramePre) {
            props.onRenderFramePre(ctx, globalScale);
        }
    }, [mousePos, props, ref]);

    return (
        <div 
            style={{ width: props.width, height: props.height, position: 'relative', overflow: 'hidden' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <ForceGraph2D
                ref={ref == null ? undefined : (ref as MutableRefObject<any>)}
                {...props}
                onRenderFramePre={handleRenderFramePre}
            />
        </div>
    );
});

export default GraphNetwork2D;