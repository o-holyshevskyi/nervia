/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
    type MutableRefObject,
} from 'react';
import dynamic from 'next/dynamic';
import { forceManyBody, forceCollide, forceLink } from 'd3-force-3d';
import * as THREE from 'three';
import { FileText, Lightbulb, LinkIcon, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { renderToStaticMarkup } from 'react-dom/server';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

// ─── Caches ────────────────────────────────────────────────────────────────
const textureCache: Record<string, THREE.Texture> = {};
let circularAlphaMaskTexture: THREE.CanvasTexture | null = null;

/** Full-round circle alpha mask for link icons (single shared texture). */
function getCircularAlphaMaskTexture(): THREE.CanvasTexture {
    if (circularAlphaMaskTexture) return circularAlphaMaskTexture;
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    circularAlphaMaskTexture = new THREE.CanvasTexture(canvas);
    circularAlphaMaskTexture.needsUpdate = true;
    return circularAlphaMaskTexture;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function ensureHex(color: string): string {
    return color.startsWith('#') ? color : '#a855f7';
}

function hexRgb(hex: string): [number, number, number] {
    const h = ensureHex(hex).slice(1);
    return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
    ];
}

/** Plain text texture for node labels: no shadow/neon, theme-based color (white on dark, dark on light). */
function createSimpleLabelTexture(text: string, textColor: string): THREE.CanvasTexture {
    const pad = 16;
    const fontSize = 14;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.font = `400 ${fontSize}px Inter, Arial, sans-serif`;
    const m = ctx.measureText(text);
    const w = Math.min(320, Math.ceil(m.width) + pad * 2);
    const h = fontSize * 1.6 + pad;
    canvas.width = w;
    canvas.height = h;
    ctx.font = `400 ${fontSize}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textColor;
    ctx.fillText(text, w / 2, h / 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function loadFaviconTexture(url: string, fgRef?: React.MutableRefObject<any>): THREE.Texture {
    if (textureCache[url]) return textureCache[url];

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
        ctx.clearRect(0, 0, 64, 64);
        ctx.save();
        ctx.beginPath();
        // Радіус трохи менший за 32 (наприклад, 30), щоб уникнути обрізки країв bloom-ом
        ctx.arc(32, 32, 30, 0, Math.PI * 2); 
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 2, 2, 60, 60); // Малюємо трохи менше зображення
        ctx.restore();
        texture.needsUpdate = true;
        fgRef?.current?.refresh();
    };

    img.onerror = () => {
        console.warn('Favicon failed:', url);
    };

    img.src = url;

    textureCache[url] = texture;
    return texture;
}

function createIconTexture(IconComponent: any, color: string): THREE.Texture {
    const key = `icon-${IconComponent.displayName ?? 'icon'}-${color}`;
    if (textureCache[key]) return textureCache[key];

    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const texture = new THREE.CanvasTexture(canvas);

    const svgStr = renderToStaticMarkup(
        <IconComponent color={color} size={48} strokeWidth={2} />
    );
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
        ctx.clearRect(0, 0, 64, 64);
        ctx.drawImage(img, 8, 8, 48, 48);
        texture.needsUpdate = true;
        URL.revokeObjectURL(url);
    };
    img.src = url;

    textureCache[key] = texture;
    return texture;
}

function createNebulaTexture(color: string): THREE.CanvasTexture {
    const key = `nebula-${color}`;
    if (textureCache[key]) return textureCache[key] as THREE.CanvasTexture;

    const S = 256;
    const canvas = document.createElement('canvas');
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const [r, g, b] = hexRgb(color);

    const grad = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grad.addColorStop(0,    `rgba(${r},${g},${b},0.30)`);
    grad.addColorStop(0.35, `rgba(${r},${g},${b},0.18)`);
    grad.addColorStop(0.7,  `rgba(${r},${g},${b},0.07)`);
    grad.addColorStop(1,    `rgba(${r},${g},${b},0.00)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);

    const tex = new THREE.CanvasTexture(canvas);
    textureCache[key] = tex;
    return tex;
}

// ─── Fallback palette ──────────────────────────────────────────────────────
const FALLBACK_COLORS: Record<string, string> = {
    '1': '#64748b',
    '2': '#10b981',
    '3': '#a855f7',
    '4': '#f97316',
    '5': '#06b6d4',
};

// ─── Props ─────────────────────────────────────────────────────────────────
export interface GraphNetwork3DProps {
    width: number;
    height: number;
    graphData: { nodes: any[]; links: any[] };
    graphTheme: { nodeColor: string; linkColor: string; graphBg: string };
    groupColorsById: Record<string, string>;
    groupNamesById: Record<string, string>;
    /** Optional short description per group (e.g. for cluster blob labels). */
    groupDescriptionsById?: Record<string, string>;
    nodeIdToGroupKeyMap: Map<string | number, string | number>;
    getNodeGroupKey: (node: any) => string | number;
    getNodeLabel: (node: any) => string;
    /** Same as 2D: favicon URL for link nodes, null for idea/note (use Lucide icons). */
    getNodeIconUrl: (node: any) => string | null;
    linkDistance?: number;
    readOnly?: boolean;
    onNodeSelect?: (node: any) => void;
    onNodeContextMenu?: (node: any, event: MouseEvent) => void;
    onBackgroundClick?: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────
const GraphNetwork3D = forwardRef<any, GraphNetwork3DProps>(function GraphNetwork3D(
    {
        width,
        height,
        graphData,
        graphTheme,
        groupColorsById,
        groupNamesById,
        groupDescriptionsById,
        nodeIdToGroupKeyMap,
        getNodeGroupKey,
        getNodeLabel,
        getNodeIconUrl,
        linkDistance = 150,
        readOnly = false,
        onNodeSelect,
        onNodeContextMenu,
        onBackgroundClick,
    },
    ref
) {
    const bloomRef  = useRef<any>(null);
    const nebulaRef = useRef<THREE.Group | null>(null);
    const fgRef = useRef<any>(null);
    const initialZoomDoneRef = useRef(false);
    const orbitRafRef = useRef<number>(0);
    const orbitMapRef = useRef<Map<any, { radius: number; theta: number; phi: number; speedTheta: number; speedPhi: number }>>(new Map());
    const clusterOrbitMapRef = useRef<Map<string, { radius: number; theta: number; phi: number; speedTheta: number; speedPhi: number }>>(new Map());
    const orbitInitializedRef = useRef(false);
    const starsRef = useRef<THREE.Points | null>(null);
    
    useImperativeHandle(ref, () => fgRef.current ?? null, []);

    const [hoveredLink, setHoveredLink] = useState<any | null>(null);
    const [mousePos,    setMousePos]    = useState({ x: 0, y: 0 });
    const [graphDataReady, setGraphDataReady] = useState(false);

    // Defer passing real graphData by one frame so the library creates its
    // simulation after mount; avoids "Cannot read properties of undefined (reading 'tick')"
    // when re-entering 3D or when the lib's animation loop runs before simulation exists.
    useEffect(() => {
        const id = requestAnimationFrame(() => setGraphDataReady(true));
        return () => cancelAnimationFrame(id);
    }, []);

    // ── Engine-ready signal ─────────────────────────────────────────────────
    // ForceGraph3D is loaded via dynamic import (ssr:false). On first render
    // fgRef.current is null so our physics useEffect exits early. onEngineStop
    // runs once the engine has started, re-triggering the effect with a live ref.
    const [engineReadyCount, setEngineReadyCount] = useState(0);
    const handleEngineStop = useCallback(() => {
        setEngineReadyCount((c) => c + 1);
    }, []);

    // Fallback: re-run physics/bloom/nebula after ref is likely set if onEngineStop doesn't fire.
    useEffect(() => {
        const t = setTimeout(() => setEngineReadyCount((c) => Math.max(c, 1)), 400);
        return () => clearTimeout(t);
    }, []);

    // ── Colour resolver ────────────────────────────────────────────────────
    const resolveColor = useCallback(
        (groupKey: string | number): string =>
            groupColorsById[String(groupKey)] ??
            FALLBACK_COLORS[String(groupKey)] ??
            '#a855f7',
        [groupColorsById]
    );

    // ── Normalise data ─────────────────────────────────────────────────────
    const cleanData = useMemo(() => ({
        nodes: graphData.nodes.map((n: any) => ({
            ...n,
            id: typeof n.id === 'object' ? n.id.id : n.id,
        })),
        links: graphData.links.map((l: any) => ({
            ...l,
            source: typeof l.source === 'object' ? l.source.id : l.source,
            target: typeof l.target === 'object' ? l.target.id : l.target,
        })),
    }), [graphData]);

    // ── Cluster centroids (Fibonacci sphere) with name and optional description ─
    const groupCentroids = useMemo(() => {
        const RADIUS = 400;
        const keys = [
            ...new Set(
                cleanData.nodes.map((n: any) =>
                    String(nodeIdToGroupKeyMap.get(n.id) ?? getNodeGroupKey(n))
                )
            ),
        ];
        const CLUSTER_COLOR_OPACITY = 0.05;
        const out: Record<string, { x: number; y: number; z: number; color: string; opacity: number; name: string; description?: string }> = {};
        keys.forEach((key, i) => {
            const phi   = Math.acos(-1 + (2 * i) / Math.max(keys.length, 1));
            const theta = Math.sqrt(keys.length * Math.PI) * phi;
            out[key] = {
                x:       RADIUS * Math.cos(theta) * Math.sin(phi),
                y:       RADIUS * Math.sin(theta) * Math.sin(phi),
                z:       RADIUS * Math.cos(phi),
                color:   resolveColor(key),
                opacity: CLUSTER_COLOR_OPACITY,
                name:    groupNamesById[key] ?? (key.length >= 32 ? 'No Group' : 'No Group'),
                description: groupDescriptionsById?.[key],
            };
        });
        return out;
    }, [cleanData.nodes, nodeIdToGroupKeyMap, getNodeGroupKey, resolveColor, groupNamesById, groupDescriptionsById]);

    // ── Physics & initial camera ───────────────────────────────────────────
    // NOTE: `engineReadyCount` ensures this re-runs once ForceGraph3D mounts
    // (dynamic import resolves) and fgRef becomes available.
    useEffect(() => {
        const fg = fgRef.current;
        if (!fg || !graphDataReady) return;

        let zoomTimer: ReturnType<typeof setTimeout> | undefined;
        try {
            const centerMap = groupCentroids;

            fg.d3Force(
                'link',
                forceLink()
                    .id((d: any) => d.id)
                    .distance(linkDistance)
                    .strength((link: any) => {
                        const sId = typeof link.source === 'object' ? link.source.id : link.source;
                        const tId = typeof link.target === 'object' ? link.target.id : link.target;
                        const sNode = cleanData.nodes.find((n: any) => n.id === sId);
                        const tNode = cleanData.nodes.find((n: any) => n.id === tId);
                        if (!sNode || !tNode) return 0.3;
                        const sk = String(nodeIdToGroupKeyMap.get(sNode.id) ?? getNodeGroupKey(sNode));
                        const tk = String(nodeIdToGroupKeyMap.get(tNode.id) ?? getNodeGroupKey(tNode));
                        return sk === tk ? 0.8 : 0.2;
                    })
            );
            fg.d3Force('charge', forceManyBody().strength(-280));
            fg.d3Force(
                'collide',
                forceCollide()
                    .radius((n: any) => Math.max((n.val ?? 4) * 2, 18))
                    .strength(0.9)
            );

            const d3f3d = require('d3-force-3d');
            fg.d3Force('cx', d3f3d.forceX((n: any) => {
                const k = String(nodeIdToGroupKeyMap.get(n.id) ?? getNodeGroupKey(n));
                return centerMap[k]?.x ?? 0;
            }).strength(0.25));
            fg.d3Force('cy', d3f3d.forceY((n: any) => {
                const k = String(nodeIdToGroupKeyMap.get(n.id) ?? getNodeGroupKey(n));
                return centerMap[k]?.y ?? 0;
            }).strength(0.25));
            fg.d3Force('cz', d3f3d.forceZ((n: any) => {
                const k = String(nodeIdToGroupKeyMap.get(n.id) ?? getNodeGroupKey(n));
                return centerMap[k]?.z ?? 0;
            }).strength(0.25));

            fg.d3Force('center', null);
            if (typeof fg.d3ReheatSimulation === 'function') fg.d3ReheatSimulation();

            // Only auto zoom-to-fit on first load; don't recenter when user is zooming/panning
            if (!initialZoomDoneRef.current) {
                // 🔥 Reduced delay from 800ms to 100ms so it starts moving immediately
                zoomTimer = setTimeout(() => {
                    try {
                        fg.zoomToFit?.(0, 120); // instant — transition already handled by parent crossfade
                        initialZoomDoneRef.current = true;
                    } catch { /* ignore */ }
                }, 80);
            }
        } catch (err) {
            console.warn('[GraphNetwork3D] physics setup:', err);
        }
        return () => { if (zoomTimer) clearTimeout(zoomTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [engineReadyCount, graphDataReady, cleanData, linkDistance, groupCentroids, nodeIdToGroupKeyMap, getNodeGroupKey]);

    const isLightTheme = useMemo(() => {
        const bg = graphTheme.graphBg?.trim() || '#000000';
        
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
    }, [graphTheme.graphBg]);

    // ── Bloom post-processing ──────────────────────────────────────────────
    useEffect(() => {
        const fg = fgRef.current;
        if (!fg) return;
        
        import('three/addons/postprocessing/UnrealBloomPass.js').then(({ UnrealBloomPass }) => {
            const composer = fg.postProcessingComposer();
            if (bloomRef.current) {
                try { composer.removePass(bloomRef.current); } catch (e) {}
                bloomRef.current = null;
            }
        });
    }, [engineReadyCount]);

    // ── Nebula cluster sprites ─────────────────────────────────────────────
    useEffect(() => {
        const fg = fgRef.current;
        if (!fg) return;
    
        const scene: THREE.Scene = fg.scene();
    
        if (nebulaRef.current) {
            scene.remove(nebulaRef.current);
            nebulaRef.current.traverse((obj: any) => {
                obj.geometry?.dispose();
                obj.material?.dispose();
            });
        }
    
        const group = new THREE.Group();
        group.name = 'nebula';
    
        const labelColor = graphTheme.nodeColor?.trim() && graphTheme.nodeColor !== 'transparent'
            ? graphTheme.nodeColor
            : '#e2e8f0';
    
        // 🔥 Змінили Object.values на Object.entries, щоб мати доступ до key
        Object.entries(groupCentroids).forEach(([key, c]) => {
            // Створюємо групу для КОНКРЕТНОГО кластера
            const clusterGroup = new THREE.Group();
            clusterGroup.name = `cluster-${key}`; // Даємо ім'я для пошуку
            clusterGroup.position.set(c.x, c.y, c.z); // Ставимо групу на стартову позицію
    
            const tex = createNebulaTexture(c.color);
            const mat = new THREE.SpriteMaterial({
                map: tex,
                transparent: true,
                blending: THREE.NormalBlending,
                depthWrite: false,
                opacity: c.opacity ? c.opacity * (isLightTheme ? 12 : 6) : 0.35,
            });
            const sprite = new THREE.Sprite(mat);
            sprite.scale.set(450, 450, 1); 
            sprite.position.set(0, 0, 0); // Відносно clusterGroup
            clusterGroup.add(sprite);
    
            const nameTex = createSimpleLabelTexture(c.name, labelColor);
            const nameMat = new THREE.SpriteMaterial({
                map: nameTex,
                transparent: true,
                depthWrite: false,
            });
            const nameSprite = new THREE.Sprite(nameMat);
            nameSprite.scale.set(Math.max(120, c.name.length * 8), 24, 1);
            nameSprite.position.set(0, 0, 0); // Відносно clusterGroup
            clusterGroup.add(nameSprite);
    
            if (c.description) {
                const descTex = createSimpleLabelTexture(c.description, labelColor);
                const descMat = new THREE.SpriteMaterial({
                    map: descTex,
                    transparent: true,
                    depthWrite: false,
                    opacity: 0.85,
                });
                const descSprite = new THREE.Sprite(descMat);
                descSprite.scale.set(Math.min(280, c.description.length * 6), 18, 1);
                descSprite.position.set(0, -28, 0); // Відносно clusterGroup
                clusterGroup.add(descSprite);
            }
    
            // Додаємо кластер у загальну туманність
            group.add(clusterGroup);
        });

        if (!starsRef.current) {
            const starGeo = new THREE.BufferGeometry();
            const starCount = 2000;
            const posArr = new Float32Array(starCount * 3);
            for(let i = 0; i < starCount * 3; i++) {
                // Розкидаємо пил у радіусі 4000 одиниць
                posArr[i] = (Math.random() - 0.5) * 4000; 
            }
            starGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
            const starMat = new THREE.PointsMaterial({
                color: isLightTheme ? 0x00050d : 0xffffff, // Темніші зірки для світлої теми
                size: isLightTheme ? 3 : 1.5,
                transparent: true,
                opacity: isLightTheme ? 0.9 : 0.6,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            const stars = new THREE.Points(starGeo, starMat);
            scene.add(stars);
            starsRef.current = stars;
        }
    
        scene.add(group);
        nebulaRef.current = group;
    }, [engineReadyCount, groupCentroids, graphTheme.nodeColor, isLightTheme]);

    useEffect(() => {
        if (!graphDataReady) return;
    
        const GOLDEN = 2.399;
        const BASE_SPEED    = 0.00008;   // node orbit around cluster
        const CLUSTER_SPEED = 0.000022;  // cluster orbit around global center
    
        const init = (): boolean => {
            const nodes = cleanData.nodes;
            const centers = groupCentroids;
            if (!nodes.length || !Object.keys(centers).length) return false;
    
            const settled = nodes.filter((n: any) =>
                isFinite(n.x) && isFinite(n.y) && isFinite(n.z) &&
                (Math.abs(n.x) > 1 || Math.abs(n.y) > 1 || Math.abs(n.z) > 1)
            );
            if (settled.length < nodes.length * 0.8) return false;
    
            // Cluster centroids orbit global center
            Object.entries(centers).forEach(([key, center], i) => {
                const radius = Math.hypot(center.x, center.y, center.z);
                const theta  = Math.atan2(center.y, center.x);
                const phi    = Math.acos(center.z / Math.max(radius, 1));
                const speed  = CLUSTER_SPEED * (0.8 + ((i * GOLDEN) % 1) * 0.4);
                clusterOrbitMapRef.current.set(key, {
                    radius: Math.max(10, radius),
                    theta, phi,
                    speedTheta: speed,
                    speedPhi:   speed * 0.618, // different axis speed for 3D feel
                });
            });
    
            // Nodes orbit their cluster centroid
            nodes.forEach((node: any, i: number) => {
                if (node.fx != null) return;
                const key = String(nodeIdToGroupKeyMap.get(node.id) ?? getNodeGroupKey(node));
                const center = centers[key];
                if (!center) return;
                const dx = (node.x ?? 0) - center.x;
                const dy = (node.y ?? 0) - center.y;
                const dz = (node.z ?? 0) - center.z;
                const radius = Math.max(10, Math.hypot(dx, dy, dz));
                const theta  = Math.atan2(dy, dx);
                const phi    = Math.acos(dz / Math.max(radius, 1));
                const speed  = BASE_SPEED * (0.7 + ((i * GOLDEN) % 1) * 0.6);
                orbitMapRef.current.set(node, {
                    radius, theta, phi,
                    speedTheta: speed,
                    speedPhi:   speed * 0.618,
                });
            });
    
            return orbitMapRef.current.size > 0;
        };
    
        let lastTime = 0;
        const tick = (now: number) => {
            const fg  = fgRef.current;
            const dt  = Math.min(lastTime ? now - lastTime : 16, 64);
            lastTime  = now;
    
            if (fg) {
                if (starsRef.current) {
                    starsRef.current.rotation.y -= dt * 0.000015; // Повільно крутиться
                    starsRef.current.rotation.x -= dt * 0.000005; // Трохи нахиляється
                }
                
                if (!orbitInitializedRef.current) {
                    orbitInitializedRef.current = init();
                }
    
                if (orbitInitializedRef.current) {
                    // Step 1 — advance cluster centroids
                    const liveCenters: Record<string, { x: number; y: number; z: number }> = {};
                    clusterOrbitMapRef.current.forEach((orbit, key) => {
                        orbit.theta += orbit.speedTheta * dt;
                        orbit.phi   += orbit.speedPhi   * dt * 0.3;
                        const sinPhi = Math.sin(orbit.phi);
                        
                        const cx = orbit.radius * Math.cos(orbit.theta) * sinPhi;
                        const cy = orbit.radius * Math.sin(orbit.theta) * sinPhi;
                        const cz = orbit.radius * Math.cos(orbit.phi);
                        
                        liveCenters[key] = { x: cx, y: cy, z: cz };
                
                        if (nebulaRef.current) {
                            const clusterGroup = nebulaRef.current.getObjectByName(`cluster-${key}`);
                            if (clusterGroup) {
                                clusterGroup.position.set(cx, cy, cz);
                            }
                        }
                    });
                
                    // Step 2 — advance nodes
                    orbitMapRef.current.forEach((orbit, node) => {
                        orbit.theta += orbit.speedTheta * dt;
                        orbit.phi   += orbit.speedPhi   * dt * 0.3;
                        const sinPhi = Math.sin(orbit.phi);
                        const key    = String(nodeIdToGroupKeyMap.get(node.id) ?? getNodeGroupKey(node));
                        const center = liveCenters[key] ?? { x: 0, y: 0, z: 0 };
                        
                        // ВАЖЛИВО: Використовуємо fx, fy, fz. 
                        // Це каже D3: "Я керую цією нодою, припини симулювати її фізику"
                        node.fx = center.x + orbit.radius * Math.cos(orbit.theta) * sinPhi;
                        node.fy = center.y + orbit.radius * Math.sin(orbit.theta) * sinPhi;
                        node.fz = center.z + orbit.radius * Math.cos(orbit.phi);
                    });
                
                    // ❌ ТУТ БУВ fg.refresh?.() — ВІН ВБИВАВ БРАУЗЕР. МИ ЙОГО ВИДАЛИЛИ!
                }
            }
    
            orbitRafRef.current = requestAnimationFrame(tick);
        };
    
        const startTimer = setTimeout(() => {
            orbitRafRef.current = requestAnimationFrame(tick);
        }, 900); // slightly longer than 2D — 3D simulation takes longer to settle
    
        return () => {
            clearTimeout(startTimer);
            cancelAnimationFrame(orbitRafRef.current);
            orbitMapRef.current.clear();
            clusterOrbitMapRef.current.clear();
            orbitInitializedRef.current = false;
        };
    }, [graphDataReady, cleanData.nodes, groupCentroids, nodeIdToGroupKeyMap, getNodeGroupKey]);

    // ── Node THREE object ──────────────────────────────────────────────────
    const nodeThreeObject = useCallback(
        (node: any) => {
            const groupKey = String(nodeIdToGroupKeyMap.get(node.id) ?? getNodeGroupKey(node));
            const color    = resolveColor(groupKey);
            const hexColor = ensureHex(color);
            const baseSize = Math.min(20, Math.max(6, node.val ?? 4));

            const group = new THREE.Group();
            const isLinkNode = node.type === 'link';

            // Inner transparent fill (low opacity so background shows through)
            group.add(new THREE.Mesh(
                new THREE.SphereGeometry(baseSize * 0.82, 24, 24),
                new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0, depthWrite: false })
            ));

            // Main ring border (semi-transparent)
            group.add(new THREE.Mesh(
                new THREE.TorusGeometry(baseSize, baseSize * 0.11, 8, 64),
                new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0.55, depthWrite: false })
            ));

            // Outer soft glow ring (skip for link nodes so favicon has no neon halo)
            if (!isLinkNode) {
                group.add(new THREE.Mesh(
                    new THREE.TorusGeometry(baseSize * 1.28, baseSize * 0.055, 8, 64),
                    new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0.22, depthWrite: false })
                ));
            }

            // Icon: favicon for link (via getNodeIconUrl), Lucide for idea/note (same as 2D)
            let iconTex: THREE.Texture | null = null;
            if (node.type === 'link') {
                const iconUrl = getNodeIconUrl(node);
                if (iconUrl) {
                    iconTex = loadFaviconTexture(iconUrl, fgRef);
                } else {
                    iconTex = createIconTexture(LinkIcon, color);
                }
            }

            if (node.type === 'idea') {
                iconTex = createIconTexture(Lightbulb, color);
            }

            if (node.type === 'note') {
                iconTex = createIconTexture(FileText, color);
            }



            if (iconTex) {
                const isLink = node.type === 'link';
                const icon = new THREE.Sprite(
                    new THREE.SpriteMaterial({
                        map: iconTex,
                        color: 0xffffff,
                        transparent: true,
                        // alphaTest відсікає пікселі з низькою прозорістю, 
                        // щоб Bloom не бачив "квадратні" краї текстури
                        alphaTest: 0.5, 
                        depthWrite: false,
                        // Важливо: встановіть true, щоб яскравість була передбачуваною
                        toneMapped: true, 
                    })
                );


                if (isLink) {
                    icon.material.opacity = 0.7;
                }
                
                const s = isLink ? baseSize * 1.6 : baseSize * 1.4;
                icon.scale.set(s, s, 1);
                group.add(icon);
            }

            return group;
        },
        [nodeIdToGroupKeyMap, getNodeGroupKey, resolveColor, getNodeIconUrl]
    );

    // ── Interaction handlers ───────────────────────────────────────────────
    const handleNodeClick = useCallback(
        (node: any) => {
            if (readOnly) return;
            const fg = fgRef.current;
            if (fg) {
                const dist = 180;
                const nx = node.x ?? 0;
                const ny = node.y ?? 0;
                const nz = node.z ?? 0;
                const hyp = Math.max(1, Math.hypot(nx, ny, nz)); 
                const ratio = 1 + dist / hyp;
                
                // ВАЖЛИВО: Передаємо {x,y,z} замість об'єкта `node`
                // Тоді камера підлетить, подивиться на точку і НЕ БУДЕ блокувати мишку
                fg.cameraPosition(
                    { x: nx * ratio, y: ny * ratio, z: nz * ratio },
                    { x: nx, y: ny, z: nz }, 
                    800
                );
            }
            onNodeSelect?.(node);
        },
        [readOnly, onNodeSelect]
    );

    const handleNodeRightClick = useCallback(
        (node: any, event: MouseEvent) => {
            if (readOnly || !onNodeContextMenu) return;
            onNodeContextMenu(node, event);
        },
        [readOnly, onNodeContextMenu]
    );

    const handleLinkHover = useCallback((link: any) => {
        setHoveredLink(link ?? null);
    }, []);

    // ── Link styling ───────────────────────────────────────────────────────
    const getLinkColor = useCallback(
        (link: any) => {
            const isHovered = link === hoveredLink;
            const isAI = link.relationType === 'ai';

            if (isHovered) {
                // При наведенні: фіолетовий для AI або основний колір теми для логічних
                return isAI ? '#a855f7' : graphTheme.nodeColor;
            }

            if (isAI) return 'rgba(168, 85, 247, 0.45)';
            
            // Використовуємо колір з CSS змінних для звичайних ліній
            return graphTheme.linkColor;
        },
        [hoveredLink, graphTheme.nodeColor, graphTheme.linkColor]
    );

    const getLinkWidth = useCallback(
        (link: any) => (link === hoveredLink ? 2.5 : (link.weight ?? 1)),
        [hoveredLink]
    );

    const getLinkParticles = useCallback(
        (link: any) => (link.relationType === 'ai' ? 3 : 0),
        []
    );

    return (
        <div
            style={{ width, height, position: 'relative', overflow: 'hidden' }}
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
        >
            <ForceGraph3D
                ref={fgRef}
                width={width}
                height={height}
                graphData={graphDataReady ? cleanData : { nodes: [], links: [] }}
                nodeThreeObject={nodeThreeObject}
                nodeThreeObjectExtend={false}
                nodeLabel={getNodeLabel}
                nodeVal={(n: any) => n.val ?? 4}
                nodeColor={(n: any) => {
                    const k = String(nodeIdToGroupKeyMap.get(n.id) ?? getNodeGroupKey(n));
                    return resolveColor(k);
                }}
                linkColor={getLinkColor}
                linkWidth={getLinkWidth}
                linkDirectionalParticles={getLinkParticles}
                linkDirectionalParticleSpeed={0.005}
                linkDirectionalParticleWidth={3}
                linkDirectionalParticleColor={() => graphTheme.nodeColor}
                onNodeClick={handleNodeClick}
                onNodeRightClick={handleNodeRightClick}
                onBackgroundClick={onBackgroundClick}
                onLinkHover={handleLinkHover}
                onEngineStop={handleEngineStop}
                enablePointerInteraction
                backgroundColor="rgba(0,0,0,0)"
            />

            <AnimatePresence>
                {hoveredLink && (
                    <motion.div
                        key="link-tooltip-3d"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute z-50 pointer-events-none bg-white/95 dark:bg-neutral-900/90 backdrop-blur-md border border-black/10 dark:border-white/10 px-4 py-3 rounded-xl shadow-xl dark:shadow-2xl flex flex-col gap-1 min-w-[200px]"
                        style={{ left: mousePos.x + 15, top: mousePos.y + 15 }}
                    >
                        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider mb-1">
                            {hoveredLink.relationType === 'ai' ? (
                                <>
                                    <Sparkles size={12} className="text-indigo-600 dark:text-purple-400" />
                                    <span className="text-indigo-600 dark:text-purple-400">AI Connection</span>
                                </>
                            ) : (
                                <>
                                    <LinkIcon size={12} className="text-neutral-500 dark:text-neutral-400" />
                                    <span className="text-neutral-600 dark:text-neutral-400">Logical connection</span>
                                </>
                            )}
                        </div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                            {hoveredLink.label ?? 'Communication'}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

export default GraphNetwork3D;