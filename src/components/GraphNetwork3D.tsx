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

function getCircularAlphaMaskTexture(): THREE.CanvasTexture {
    if (circularAlphaMaskTexture) return circularAlphaMaskTexture;
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'black'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2); ctx.fill();
    circularAlphaMaskTexture = new THREE.CanvasTexture(canvas);
    circularAlphaMaskTexture.needsUpdate = true;
    return circularAlphaMaskTexture;
}

function ensureHex(color: string): string {
    return color.startsWith('#') ? color : '#a855f7';
}

function hexRgb(hex: string): [number, number, number] {
    const h = ensureHex(hex).slice(1);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function createSimpleLabelTexture(text: string, textColor: string): THREE.CanvasTexture {
    const pad = 16, fontSize = 14;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.font = `400 ${fontSize}px Inter, Arial, sans-serif`;
    const m = ctx.measureText(text);
    const w = Math.min(320, Math.ceil(m.width) + pad * 2);
    const h = fontSize * 1.6 + pad;
    canvas.width = w; canvas.height = h;
    ctx.font = `400 ${fontSize}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = textColor;
    ctx.fillText(text, w / 2, h / 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function loadFaviconTexture(url: string, fgRef?: React.MutableRefObject<any>): THREE.Texture {
    if (textureCache[url]) return textureCache[url];
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        ctx.clearRect(0, 0, 64, 64);
        ctx.save();
        ctx.beginPath(); ctx.arc(32, 32, 30, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
        ctx.drawImage(img, 2, 2, 60, 60);
        ctx.restore();
        texture.needsUpdate = true;
        fgRef?.current?.refresh();
    };
    img.onerror = () => { console.warn('Favicon failed:', url); };
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
    const svgStr = renderToStaticMarkup(<IconComponent color={color} size={48} strokeWidth={2} />);
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

const FALLBACK_COLORS: Record<string, string> = {
    '1': '#64748b', '2': '#10b981', '3': '#a855f7', '4': '#f97316', '5': '#06b6d4',
};

export interface PhysicsConfig3D {
    repulsion: number;
    linkDistance: number;
    nodeSpeed: number;
    clusterSpeed: number;
}

export interface GraphNetwork3DProps {
    width: number;
    height: number;
    graphData: { nodes: any[]; links: any[] };
    graphTheme: { nodeColor: string; linkColor: string; graphBg: string };
    groupColorsById: Record<string, string>;
    groupNamesById: Record<string, string>;
    groupDescriptionsById?: Record<string, string>;
    nodeIdToGroupKeyMap: Map<string | number, string | number>;
    getNodeGroupKey: (node: any) => string | number;
    getNodeLabel: (node: any) => string;
    getNodeIconUrl: (node: any) => string | null;
    physicsConfig: PhysicsConfig3D;
    linkDistance?: number;
    readOnly?: boolean;
    onNodeSelect?: (node: any) => void;
    onNodeContextMenu?: (node: any, event: MouseEvent) => void;
    onBackgroundClick?: () => void;
}

const GraphNetwork3D = forwardRef<any, GraphNetwork3DProps>(function GraphNetwork3D(
    {
        width, height, graphData, graphTheme, groupColorsById, groupNamesById,
        groupDescriptionsById, nodeIdToGroupKeyMap, getNodeGroupKey, getNodeLabel,
        getNodeIconUrl, physicsConfig, linkDistance = 150, readOnly = false,
        onNodeSelect, onNodeContextMenu, onBackgroundClick,
    },
    ref
) {
    const bloomRef  = useRef<any>(null);
    const nebulaRef = useRef<THREE.Group | null>(null);
    const starsRef  = useRef<THREE.Points | null>(null);
    const fgRef = useRef<any>(null);
    const initialZoomDoneRef = useRef(false);

    // ── Orbital animation refs ───────────────────────────────────────────────
    const orbitRafRef = useRef<number>(0);
    const orbitMapRef = useRef<Map<any, {
        radius: number; theta: number; phi: number;
        speedFactor: number;
    }>>(new Map());
    const clusterOrbitMapRef = useRef<Map<string, {
        radius: number; theta: number; phi: number;
        speedFactor: number;
    }>>(new Map());
    const orbitInitializedRef = useRef(false);

    // ── Physics config live-read ref (same pattern as 2D) ───────────────────
    const physicsConfigRef = useRef(physicsConfig);
    physicsConfigRef.current = physicsConfig; // updated every render

    // ── Settling guard — orbital tick yields while physics reheat runs ───────
    const physicsSettlingRef      = useRef(false);
    const physicsSettlingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Drag state ───────────────────────────────────────────────────────────
    const draggingNodeRef = useRef<any>(null);

    useImperativeHandle(ref, () => fgRef.current ?? null, []);

    const [hoveredLink, setHoveredLink] = useState<any | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [graphDataReady, setGraphDataReady] = useState(false);

    useEffect(() => {
        const id = requestAnimationFrame(() => setGraphDataReady(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const [engineReadyCount, setEngineReadyCount] = useState(0);
    const handleEngineStop = useCallback(() => {
        setEngineReadyCount((c) => c + 1);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setEngineReadyCount((c) => Math.max(c, 1)), 400);
        return () => clearTimeout(t);
    }, []);

    const resolveColor = useCallback(
        (groupKey: string | number): string =>
            groupColorsById[String(groupKey)] ?? FALLBACK_COLORS[String(groupKey)] ?? '#a855f7',
        [groupColorsById]
    );

    const cleanData = useMemo(() => ({
        nodes: graphData.nodes.map((n: any) => ({ ...n, id: typeof n.id === 'object' ? n.id.id : n.id })),
        links: graphData.links.map((l: any) => ({
            ...l,
            source: typeof l.source === 'object' ? l.source.id : l.source,
            target: typeof l.target === 'object' ? l.target.id : l.target,
        })),
    }), [graphData]);

    const groupCentroids = useMemo(() => {
        const RADIUS = 400;
        const keys = [...new Set(cleanData.nodes.map((n: any) =>
            String(nodeIdToGroupKeyMap.get(n.id) ?? getNodeGroupKey(n))
        ))];
        const CLUSTER_COLOR_OPACITY = 0.05;
        const out: Record<string, { x: number; y: number; z: number; color: string; opacity: number; name: string; description?: string }> = {};
        keys.forEach((key, i) => {
            const phi   = Math.acos(-1 + (2 * i) / Math.max(keys.length, 1));
            const theta = Math.sqrt(keys.length * Math.PI) * phi;
            out[key] = {
                x: RADIUS * Math.cos(theta) * Math.sin(phi),
                y: RADIUS * Math.sin(theta) * Math.sin(phi),
                z: RADIUS * Math.cos(phi),
                color: resolveColor(key),
                opacity: CLUSTER_COLOR_OPACITY,
                name: groupNamesById[key] ?? 'No Group',
                description: groupDescriptionsById?.[key],
            };
        });
        return out;
    }, [cleanData.nodes, nodeIdToGroupKeyMap, getNodeGroupKey, resolveColor, groupNamesById, groupDescriptionsById]);

    // ── Physics & initial camera ─────────────────────────────────────────────
    useEffect(() => {
        const fg = fgRef.current;
        if (!fg || !graphDataReady) return;
        let zoomTimer: ReturnType<typeof setTimeout> | undefined;
        try {
            const centerMap = groupCentroids;
            fg.d3Force('link', (forceLink() as any).id((d: unknown) => (d as any).id).distance(physicsConfig.linkDistance).strength((link: any) => {
                const src = link.source as { id: string } | string;
                const tgt = link.target as { id: string } | string;
                const sId = typeof src === 'object' ? src.id : src;
                const tId = typeof tgt === 'object' ? tgt.id : tgt;
                const sNode = cleanData.nodes.find((n: any) => n.id === sId);
                const tNode = cleanData.nodes.find((n: any) => n.id === tId);
                if (!sNode || !tNode) return 0.3;
                const sk = String(nodeIdToGroupKeyMap.get(sNode.id) ?? getNodeGroupKey(sNode));
                const tk = String(nodeIdToGroupKeyMap.get(tNode.id) ?? getNodeGroupKey(tNode));
                return sk === tk ? 0.8 : 0.2;
            }) as any);
            fg.d3Force('charge', (forceManyBody() as any).strength(-physicsConfig.repulsion));
            fg.d3Force('collide', (forceCollide() as any).radius((n: any) => Math.max(((n as any).val ?? 4) * 2, 18)).strength(0.9));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const d3f3d: any = require('d3-force-3d');
            const forceX = (d3f3d.forceX((n: any) => { const k = String(nodeIdToGroupKeyMap.get(n.id) ?? getNodeGroupKey(n)); return centerMap[k]?.x ?? 0; }) as any).strength(0.25);
            const forceY = (d3f3d.forceY((n: any) => { const k = String(nodeIdToGroupKeyMap.get(n.id) ?? getNodeGroupKey(n)); return centerMap[k]?.y ?? 0; }) as any).strength(0.25);
            const forceZ = (d3f3d.forceZ((n: any) => { const k = String(nodeIdToGroupKeyMap.get(n.id) ?? getNodeGroupKey(n)); return centerMap[k]?.z ?? 0; }) as any).strength(0.25);
            fg.d3Force('cx', forceX);
            fg.d3Force('cy', forceY);
            fg.d3Force('cz', forceZ);
            fg.d3Force('center', null);

            // If orbital is already running, pause it and let physics settle
            if (orbitInitializedRef.current) {
                physicsSettlingRef.current = true;
                if (physicsSettlingTimerRef.current) clearTimeout(physicsSettlingTimerRef.current);
                physicsSettlingTimerRef.current = setTimeout(() => {
                    orbitMapRef.current.clear();
                    clusterOrbitMapRef.current.clear();
                    orbitInitializedRef.current = false;
                    physicsSettlingRef.current = false;
                }, 1200);
            }

            if (typeof fg.d3ReheatSimulation === 'function') fg.d3ReheatSimulation();
            if (!initialZoomDoneRef.current) {
                zoomTimer = setTimeout(() => {
                    try { fg.zoomToFit?.(0, 120); initialZoomDoneRef.current = true; } catch { /* ignore */ }
                }, 80);
            }
        } catch (err) { console.warn('[GraphNetwork3D] physics setup:', err); }
        return () => { if (zoomTimer) clearTimeout(zoomTimer); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [engineReadyCount, graphDataReady, cleanData, physicsConfig, groupCentroids, nodeIdToGroupKeyMap, getNodeGroupKey]);

    const isLightTheme = useMemo(() => {
        const bg = graphTheme.graphBg?.trim() || '#000000';
        if (bg.startsWith('#')) {
            const hex = bg.replace('#', '');
            const r = parseInt(hex.length === 3 ? hex[0]+hex[0] : hex.slice(0, 2), 16);
            const g = parseInt(hex.length === 3 ? hex[1]+hex[1] : hex.slice(2, 4), 16);
            const b = parseInt(hex.length === 3 ? hex[2]+hex[2] : hex.slice(4, 6), 16);
            return (r * 0.299 + g * 0.587 + b * 0.114) / 255 > 0.5;
        }
        if (bg.startsWith('rgb')) {
            const match = bg.match(/\d+/g);
            if (match && match.length >= 3) {
                return (parseInt(match[0]) * 0.299 + parseInt(match[1]) * 0.587 + parseInt(match[2]) * 0.114) / 255 > 0.5;
            }
        }
        return false;
    }, [graphTheme.graphBg]);

    // ── Bloom post-processing ────────────────────────────────────────────────
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

    // ── Nebula cluster sprites ───────────────────────────────────────────────
    useEffect(() => {
        const fg = fgRef.current;
        if (!fg) return;
        const scene: THREE.Scene = fg.scene();

        // Tear down old nebula
        if (nebulaRef.current) {
            scene.remove(nebulaRef.current);
            nebulaRef.current.traverse((obj: any) => { obj.geometry?.dispose(); obj.material?.dispose(); });
        }

        const group = new THREE.Group();
        group.name = 'nebula';

        const labelColor = graphTheme.nodeColor?.trim() && graphTheme.nodeColor !== 'transparent'
            ? graphTheme.nodeColor : '#e2e8f0';

        // Each cluster gets a named sub-group so the orbital tick can reposition it
        Object.entries(groupCentroids).forEach(([key, c]) => {
            const clusterGroup = new THREE.Group();
            clusterGroup.name = `cluster-${key}`;
            clusterGroup.position.set(c.x, c.y, c.z);

            // Invalidate cached nebula texture when color changes
            const nebulaKey = `nebula-${c.color}`;
            delete textureCache[nebulaKey];
            const tex = createNebulaTexture(c.color);
            const mat = new THREE.SpriteMaterial({
                map: tex, transparent: true,
                blending: THREE.NormalBlending, depthWrite: false,
                opacity: c.opacity ? c.opacity * (isLightTheme ? 12 : 6) : 0.35,
            });
            const sprite = new THREE.Sprite(mat);
            sprite.scale.set(450, 450, 1);
            sprite.position.set(0, 0, 0);
            clusterGroup.add(sprite);

            const nameTex = createSimpleLabelTexture(c.name, labelColor);
            const nameMat = new THREE.SpriteMaterial({ map: nameTex, transparent: true, depthWrite: false });
            const nameSprite = new THREE.Sprite(nameMat);
            nameSprite.scale.set(Math.max(120, c.name.length * 8), 24, 1);
            nameSprite.position.set(0, 0, 0);
            clusterGroup.add(nameSprite);

            if (c.description) {
                const descTex = createSimpleLabelTexture(c.description, labelColor);
                const descMat = new THREE.SpriteMaterial({ map: descTex, transparent: true, depthWrite: false, opacity: 0.85 });
                const descSprite = new THREE.Sprite(descMat);
                descSprite.scale.set(Math.min(280, c.description.length * 6), 18, 1);
                descSprite.position.set(0, -28, 0);
                clusterGroup.add(descSprite);
            }

            group.add(clusterGroup);
        });

        scene.add(group);
        nebulaRef.current = group;

        // ── Stars / microspace dust ──────────────────────────────────────────
        // Remove old stars before re-creating (theme may have flipped)
        if (starsRef.current) {
            scene.remove(starsRef.current);
            starsRef.current.geometry.dispose();
            (starsRef.current.material as THREE.Material).dispose();
            starsRef.current = null;
        }
        const starGeo = new THREE.BufferGeometry();
        const starCount = 2000;
        const posArr = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i++) posArr[i] = (Math.random() - 0.5) * 4000;
        starGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        const starMat = new THREE.PointsMaterial({
            color:       isLightTheme ? 0x00050d : 0xffffff,
            size:        isLightTheme ? 3 : 1.5,
            transparent: true,
            opacity:     isLightTheme ? 0.9 : 0.6,
            blending:    THREE.AdditiveBlending,
            depthWrite:  false,
        });
        const stars = new THREE.Points(starGeo, starMat);
        scene.add(stars);
        starsRef.current = stars;

    }, [engineReadyCount, groupCentroids, groupColorsById, graphTheme.nodeColor, isLightTheme]);

    // ── Orbital animation ────────────────────────────────────────────────────
    useEffect(() => {
        if (!graphDataReady) return;

        const GOLDEN = 2.399;

        const init = (): boolean => {
            const nodes = cleanData.nodes;
            const centers = groupCentroids;
            if (!nodes.length || !Object.keys(centers).length) return false;

            const settled = nodes.filter((n: any) =>
                isFinite(n.x) && isFinite(n.y) && isFinite(n.z) &&
                (Math.abs(n.x) > 1 || Math.abs(n.y) > 1 || Math.abs(n.z) > 1)
            );
            if (settled.length < nodes.length * 0.8) return false;

            // Cluster centroids orbit global center (0,0,0)
            Object.entries(centers).forEach(([key, center], i) => {
                const radius = Math.hypot(center.x, center.y, center.z);
                const theta  = Math.atan2(center.y, center.x);
                const phi    = Math.acos(center.z / Math.max(radius, 1));
                clusterOrbitMapRef.current.set(key, {
                    radius: Math.max(10, radius), theta, phi,
                    speedFactor: 0.8 + ((i * GOLDEN) % 1) * 0.4,
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
                orbitMapRef.current.set(node, {
                    radius, theta, phi,
                    speedFactor: 0.7 + ((i * GOLDEN) % 1) * 0.6,
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
                // While physics is reheating, yield — don't overwrite node positions
                if (physicsSettlingRef.current) {
                    fg.refresh?.();
                    orbitRafRef.current = requestAnimationFrame(tick);
                    return;
                }

                if (!orbitInitializedRef.current) {
                    orbitInitializedRef.current = init();
                }

                if (orbitInitializedRef.current) {
                    const nodeSpeedBase    = physicsConfigRef.current.nodeSpeed    / 1000000;
                    const clusterSpeedBase = physicsConfigRef.current.clusterSpeed / 1000000;

                    // Slowly rotate the star field
                    if (starsRef.current) {
                        starsRef.current.rotation.y -= dt * 0.000015;
                        starsRef.current.rotation.x -= dt * 0.000005;
                    }

                    // Step 1 — advance cluster centroids around (0,0,0)
                    const liveCenters: Record<string, { x: number; y: number; z: number }> = {};
                    clusterOrbitMapRef.current.forEach((orbit, key) => {
                        const dTheta = orbit.speedFactor * clusterSpeedBase * dt;
                        orbit.theta += dTheta;
                        orbit.phi   += dTheta * 0.618 * 0.3;
                        const sinPhi = Math.sin(orbit.phi);
                        const cx = orbit.radius * Math.cos(orbit.theta) * sinPhi;
                        const cy = orbit.radius * Math.sin(orbit.theta) * sinPhi;
                        const cz = orbit.radius * Math.cos(orbit.phi);
                        liveCenters[key] = { x: cx, y: cy, z: cz };

                        // Move the nebula clusterGroup to follow the orbiting centroid
                        if (nebulaRef.current) {
                            const clusterGroup = nebulaRef.current.getObjectByName(`cluster-${key}`);
                            if (clusterGroup) clusterGroup.position.set(cx, cy, cz);
                        }
                    });

                    // Step 2 — advance nodes around their (now moving) cluster center
                    orbitMapRef.current.forEach((orbit, node) => {
                        // Skip the node currently being dragged
                        if (node === draggingNodeRef.current) return;
                        const dTheta = orbit.speedFactor * nodeSpeedBase * dt;
                        orbit.theta += dTheta;
                        orbit.phi   += dTheta * 0.618 * 0.3;
                        const sinPhi = Math.sin(orbit.phi);
                        const key    = String(nodeIdToGroupKeyMap.get(node.id) ?? getNodeGroupKey(node));
                        const center = liveCenters[key] ?? { x: 0, y: 0, z: 0 };
                        node.x = center.x + orbit.radius * Math.cos(orbit.theta) * sinPhi;
                        node.y = center.y + orbit.radius * Math.sin(orbit.theta) * sinPhi;
                        node.z = center.z + orbit.radius * Math.cos(orbit.phi);
                    });

                    fg.refresh?.();
                }
            }

            orbitRafRef.current = requestAnimationFrame(tick);
        };

        const startTimer = setTimeout(() => {
            orbitRafRef.current = requestAnimationFrame(tick);
        }, 900);

        return () => {
            clearTimeout(startTimer);
            cancelAnimationFrame(orbitRafRef.current);
            orbitMapRef.current.clear();
            clusterOrbitMapRef.current.clear();
            orbitInitializedRef.current = false;
        };
    }, [graphDataReady, cleanData.nodes, groupCentroids, nodeIdToGroupKeyMap, getNodeGroupKey]);

    // ── Drag handlers ────────────────────────────────────────────────────────
    const handleNodeDrag = useCallback((node: any) => {
        draggingNodeRef.current = node;
    }, []);

    const handleNodeDragEnd = useCallback((node: any) => {
        draggingNodeRef.current = null;

        const key = String(nodeIdToGroupKeyMap.get(node.id) ?? getNodeGroupKey(node));
        const clusterOrbit = clusterOrbitMapRef.current.get(key);

        // Use the current live cluster center position
        const liveCenter = clusterOrbit
            ? {
                x: clusterOrbit.radius * Math.cos(clusterOrbit.theta) * Math.sin(clusterOrbit.phi),
                y: clusterOrbit.radius * Math.sin(clusterOrbit.theta) * Math.sin(clusterOrbit.phi),
                z: clusterOrbit.radius * Math.cos(clusterOrbit.phi),
            }
            : null;

        if (!liveCenter) return;

        const existing = orbitMapRef.current.get(node);
        if (!existing) return;

        const dx = (node.x ?? 0) - liveCenter.x;
        const dy = (node.y ?? 0) - liveCenter.y;
        const dz = (node.z ?? 0) - liveCenter.z;

        existing.radius = Math.max(10, Math.hypot(dx, dy, dz));
        existing.theta  = Math.atan2(dy, dx);
        existing.phi    = Math.acos(dz / Math.max(existing.radius, 1));
        // speedTheta and speedPhi preserved — orbit resumes at same rate
    }, [nodeIdToGroupKeyMap, getNodeGroupKey]);

    // ── Node THREE object ────────────────────────────────────────────────────
    const nodeThreeObject = useCallback(
        (node: any) => {
            const groupKey = String(nodeIdToGroupKeyMap.get(node.id) ?? getNodeGroupKey(node));
            const color    = resolveColor(groupKey);
            const hexColor = ensureHex(color);
            const baseSize = Math.min(20, Math.max(6, node.val ?? 4));
            const group    = new THREE.Group();
            const isLinkNode = node.type === 'link';

            group.add(new THREE.Mesh(
                new THREE.SphereGeometry(baseSize * 0.82, 24, 24),
                new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0, depthWrite: false })
            ));
            group.add(new THREE.Mesh(
                new THREE.TorusGeometry(baseSize, baseSize * 0.11, 8, 64),
                new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0.55, depthWrite: false })
            ));
            if (!isLinkNode) {
                group.add(new THREE.Mesh(
                    new THREE.TorusGeometry(baseSize * 1.28, baseSize * 0.055, 8, 64),
                    new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0.22, depthWrite: false })
                ));
            }

            let iconTex: THREE.Texture | null = null;
            if (node.type === 'link') {
                const iconUrl = getNodeIconUrl(node);
                iconTex = iconUrl ? loadFaviconTexture(iconUrl, fgRef) : createIconTexture(LinkIcon, color);
            }
            if (node.type === 'idea') iconTex = createIconTexture(Lightbulb, color);
            if (node.type === 'note') iconTex = createIconTexture(FileText, color);

            if (iconTex) {
                const isLink = node.type === 'link';
                const icon = new THREE.Sprite(new THREE.SpriteMaterial({
                    map: iconTex, color: 0xffffff, transparent: true,
                    alphaTest: 0.5, depthWrite: false, toneMapped: true,
                }));
                if (isLink) icon.material.opacity = 0.7;
                const s = isLink ? baseSize * 1.6 : baseSize * 1.4;
                icon.scale.set(s, s, 1);
                group.add(icon);
            }

            return group;
        },
        [nodeIdToGroupKeyMap, getNodeGroupKey, resolveColor, getNodeIconUrl]
    );

    // ── Interaction handlers ─────────────────────────────────────────────────
    const handleNodeClick = useCallback(
        (node: any) => {
            if (readOnly) return;
            const fg = fgRef.current;
            if (fg) {
                const dist  = 180;
                const ratio = 1 + dist / Math.hypot(node.x ?? 1, node.y ?? 1, node.z ?? 1);
                fg.cameraPosition(
                    { x: (node.x ?? 0) * ratio, y: (node.y ?? 0) * ratio, z: (node.z ?? 0) * ratio },
                    node, 800
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

    const handleLinkHover = useCallback((link: any) => { setHoveredLink(link ?? null); }, []);

    const getLinkColor = useCallback(
        (link: any) => {
            const isHovered = link === hoveredLink;
            const isAI = link.relationType === 'ai';
            if (isHovered) return isAI ? '#a855f7' : graphTheme.nodeColor;
            if (isAI) return 'rgba(168, 85, 247, 0.45)';
            return graphTheme.linkColor;
        },
        [hoveredLink, graphTheme.nodeColor, graphTheme.linkColor]
    );

    const getLinkWidth = useCallback(
        (link: any) => (link === hoveredLink ? 2.5 : (link.weight ?? 1)),
        [hoveredLink]
    );

    const getLinkParticles = useCallback((link: any) => (link.relationType === 'ai' ? 3 : 0), []);

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
                // ── Drag ───────────────────────────────────────────────────
                onNodeDrag={handleNodeDrag}
                onNodeDragEnd={handleNodeDragEnd}
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