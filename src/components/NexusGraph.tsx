/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Group } from '../hooks/useGroups';
import { forceManyBody, forceX, forceY } from 'd3-force';

// Динамічний імпорт необхідний для Next.js, оскільки canvas працює лише в браузері
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface NexusGraphProps {
    data: {
        nodes: any[];
        links: any[];
    };
    groups: Group[],
}

export default function NexusGraph({ data, groups }: NexusGraphProps) {
    const fgRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        if (!containerRef.current) return;
        const updateDimensions = () => {
            setDimensions({
                width: containerRef.current?.offsetWidth || window.innerWidth,
                height: containerRef.current?.offsetHeight || window.innerHeight,
            });
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Словник кольорів
    const groupColorsById = useMemo(() => {
        const colorMap: Record<string, string> = {};
        const defaultGroup = groups.find(g => g.name.toLowerCase() === 'no group' || g.name.toLowerCase() === 'general');
        colorMap['default'] = defaultGroup?.color || '#6b7280';

        groups.forEach(g => {
            colorMap[g.id] = g.color;
        });
        
        return colorMap;
    }, [groups]);

    // Центри тяжіння для симуляції D3
    const groupCenters = useMemo(() => {
        const centers: Record<string, { x: number, y: number }> = {};
        
        // Дефолтна група завжди в центрі
        centers['default'] = { x: 0, y: 0 };
        
        // Відкидаємо "No Group" з математики кола, бо вона вже в центрі
        const realGroups = groups.filter(g => g.name.toLowerCase() !== 'no group' && g.name.toLowerCase() !== 'general');
        
        const radius = Math.min(dimensions.width, dimensions.height) * 0.1; 
        
        realGroups.forEach((g, i) => {
            const angle = (i * 2 * Math.PI) / realGroups.length;
            centers[g.id] = {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            };
        });
        
        return centers;
    }, [groups, dimensions]);

    // Рендер фонових глобів ДО відмальовки самих нод
    const handleRenderFramePre = useCallback((ctx: CanvasRenderingContext2D) => {
        const groupsMap = new Map<string, any[]>();
        
        // Групуємо поточні позиції нод
        data.nodes.forEach(node => {
            const gid = node.group_id || 'default';
            if (!groupsMap.has(gid)) groupsMap.set(gid, []);
            groupsMap.get(gid)!.push(node);
        });

        ctx.save();
        // Режим накладання, щоб глоби виглядали як освітлення
        ctx.globalCompositeOperation = "screen"; 

        groupsMap.forEach((nodesInGroup, gid) => {
            if (nodesInGroup.length === 0) return;

            let sumX = 0, sumY = 0, validNodes = 0;
            
            // Шукаємо центр мас групи
            nodesInGroup.forEach(n => {
                if (isFinite(n.x) && isFinite(n.y)) {
                    sumX += n.x;
                    sumY += n.y;
                    validNodes++;
                }
            });

            if (validNodes === 0) return;
            const cx = sumX / validNodes;
            const cy = sumY / validNodes;

            // Визначаємо радіус глоба за найбільш віддаленою нодою
            let maxDist = 0;
            nodesInGroup.forEach(n => {
                if (isFinite(n.x) && isFinite(n.y)) {
                    const dist = Math.hypot(n.x - cx, n.y - cy);
                    if (dist > maxDist) maxDist = dist;
                }
            });

            const radius = Math.max(80, maxDist + 40); // 40px padding
            const color = groupColorsById[gid] || groupColorsById['default'];

            // Малюємо радіальний градієнт (Globe)
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            gradient.addColorStop(0, `${color}25`); // ~15% opacity в центрі
            gradient.addColorStop(0.5, `${color}10`); // Згасання
            gradient.addColorStop(1, 'transparent'); // Краї прозорі

            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.fillStyle = gradient;
            ctx.fill();
        });

        ctx.restore();
    }, [data.nodes, groupColorsById]);

    useEffect(() => {
        let mounted = true;

        const initPhysics = () => {
            const fg = fgRef.current;
            
            // Якщо граф ще не змонтувався (через dynamic import) або немає нод - чекаємо наступного кадру
            if (!fg || !data.nodes || data.nodes.length === 0) {
                if (mounted) requestAnimationFrame(initPhysics);
                return;
            }

            // 1. Вбиваємо дефолтний центр
            fg.d3Force('center', null);

            // 2. Відштовхування
            fg.d3Force('charge', forceManyBody().strength(-60));

            // 3. Сила тяжіння до кластерів
            fg.d3Force('x', forceX((node: any) => groupCenters[node.group_id || 'default']?.x || 0).strength(0.5)); 
            fg.d3Force('y', forceY((node: any) => groupCenters[node.group_id || 'default']?.y || 0).strength(0.5));

            // 4. Лінки
            const linkForce = fg.d3Force('link');
            if (linkForce) {
                linkForce.distance(30); 
                linkForce.strength((link: any) => {
                    const sourceGroup = link.source?.group_id ?? 'default';
                    const targetGroup = link.target?.group_id ?? 'default';
                    return sourceGroup === targetGroup ? 0.8 : 0.01;
                });
            }

            // 5. Жорсткий старт
            fg.d3ReheatSimulation();
        };

        // Запускаємо цикл перевірки
        initPhysics();

        return () => {
            mounted = false; // Зупиняємо цикл, якщо компонент вмирає
        };
    }, [groupCenters, data]);

    return (
        <div ref={containerRef} className="w-full h-screen bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
            <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={data}
                // nodeRelSize={6}
                // nodeColor={(node: any) => {
                //     const groupId = node.group_id || 'default';
                //     return groupColorsById[groupId] || groupColorsById['default'];
                // }}
                linkColor={() => 'rgba(219, 18, 233, 0.40)'} // Напівпрозорі лінії
                linkWidth={1.5}
                linkDirectionalParticles={3}
                linkDirectionalParticleWidth={3}
                linkDirectionalParticleSpeed={0.005}
                linkDirectionalParticleColor={() => '#FFFFFF'}
                enablePointerInteraction={true}
                onRenderFramePre={handleRenderFramePre}
                nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                    const size = 6;
                    const color = groupColorsById[node.group_id || 'default'];
                    
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                    ctx.fillStyle = '#171717'; // Нейтральний колір самої ноди
                    ctx.fill();
                    
                    ctx.strokeStyle = color; // Ідентифікація групи
                    ctx.lineWidth = 2 / globalScale; // Фіксована товщина обводки незалежно від зуму
                    ctx.stroke();
                }}
            />
        </div>
    );
}