# Web Worker Graph Simulation — Integration Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Main Thread                       │
│                                                      │
│  GraphNetwork.tsx                                    │
│    ├─ useGraph2DWorker()  ──postMessage──►  graph2d.worker.ts
│    │    └─ on TICK: mutate node.x/y                  │      │
│    │    └─ fgRef.refresh()                           │      │  d3-force
│    │                                                 │      │  simulation
│    └─ <GraphNetwork2D>                               │      │  running here
│         └─ <ForceGraph2D>                            │      │
│              Internal sim: DISABLED (alphaDecay=1)   │      │
│              Renders from node.x/y on every rAF      │ ◄─postMessage──
└─────────────────────────────────────────────────────┘
```

**Key principle**: `react-force-graph-2d` extends input node objects in-place
(adds `x`, `y`, `vx`, `vy`). Since we keep the same object references, mutating
`node.x = workerX` is immediately visible to the renderer without any React
state updates or prop changes.

---

## Step 1 — Add the hook inside `GraphNetwork.tsx`

Find the block that starts the 2D orbital animation (`useEffect` around line 697).
Add the worker hook **above** it:

```tsx
// ── ADD: near the top of GraphNetwork(), after existing refs ─────────────────
import { useGraph2DWorker } from '../hooks/useGraph2DWorker';

// ── INSIDE the component, after processedData / graphData2D are computed ─────

const workerClusterCenters = useMemo(() => {
    // Convert clusterCentersRef to the plain-object format the hook expects.
    // clusterCentersRef is already computed by buildClusterCenters2D() earlier.
    const result: Record<string, { x: number; y: number }> = {};
    Object.entries(clusterCentersRef.current).forEach(([k, v]) => {
        result[String(k)] = v;
    });
    return result;
}, [
    // Re-compute when cluster layout changes (same deps as clusterCentersRef population)
    graphData.nodes.length, clusterMode,
]);

const {
    isSimulating: workerSimulating,
    disableInternalSim,
    dragHandlers: workerDragHandlers,
    reheat:        workerReheat,
    updateConfig:  workerUpdateConfig,
} = useGraph2DWorker({
    graphData:  graphData2D,           // the same object passed to <GraphNetwork2D>
    config: {
        repulsion:      physicsConfig.repulsion,
        linkDistance:   physicsConfig.linkDistance,
        clusterCenters: workerClusterCenters,
    },
    fgRef,
    onStable: () => {
        // Simulation has settled — allow orbital animation to init
        // (the orbital init() guard checks node positions are finite anyway,
        //  but setting a flag avoids a wasted init attempt)
        engineIsDone.current = true;
    },
});
```

---

## Step 2 — Pause the orbital RAF while worker is running

The existing orbital animation (around line 700) reads from / writes to `node.x`
and `node.y`. If it runs simultaneously with the worker tick loop both will fight
over positions. Pause it until the worker is stable:

```tsx
// Inside the orbital useEffect, replace:
//   if (!orbitInitializedRef.current) { orbitInitializedRef.current = init(); }
// with:
if (!orbitInitializedRef.current && !workerSimulating) {
    orbitInitializedRef.current = init();
}

// And inside the tick callback, skip position updates while worker is active:
if (workerSimulating) {
    fgRef.current?.refresh?.();
    ambientRafRef.current = requestAnimationFrame(tick);
    return;
}
```

Because `workerSimulating` is a React state value it won't be stale in a closure
— store it in a ref for the RAF:

```tsx
const workerSimulatingRef = useRef(false);
workerSimulatingRef.current = workerSimulating;

// Inside tick():
if (workerSimulatingRef.current) { ... }
```

---

## Step 3 — Wire props to `<GraphNetwork2D>`

`GraphNetwork2D` already accepts `onNodeDrag` / `onNodeDragEnd`.
Find where `<GraphNetwork2D ... />` is rendered (search for `<GraphNetwork2D`)
and extend its props:

```tsx
<GraphNetwork2D
    // ── existing props ──
    ref={fgRef}
    {...allYourCurrentProps}

    // ── ADD: disable internal sim + wire drag to worker ──
    {...disableInternalSim}
    onNodeDrag={(node, translate) => {
        // Keep your existing orbital drag logic AND forward to worker
        existingOnNodeDrag(node, translate);          // drag-clamp / fly physics
        workerDragHandlers.onNodeDrag(node, translate);
    }}
    onNodeDragEnd={(node, translate) => {
        existingOnNodeDragEnd(node, translate);
        workerDragHandlers.onNodeDragEnd(node);
    }}
/>
```

> **Existing drag code**: `GraphNetwork.tsx` has its own drag-clamp and fly
> physics. Those can stay — they mutate node positions locally. The worker
> receives the final position via `DRAG` messages and will respect it when
> reheating. Calling both is safe.

---

## Step 4 — Remove `fg.d3Force()` calls (prevents double-simulation)

`GraphNetwork.tsx` currently calls `fg.d3Force('charge', ...)` etc. in a
`useEffect` on `engineReadyCount`. Since the internal simulation is disabled
(`alphaDecay = 1`), these calls are harmless but unnecessary.

Search for `fg.d3Force` (around the physics setup effect) and remove the block,
or guard it:

```tsx
// BEFORE (remove or comment out):
fg.d3Force('charge', forceManyBody().strength(-physicsConfig.repulsion));
fg.d3Force('link',   forceLink(...)...);
// ...

// AFTER (keep only zoomToFit / layout tweaks, no force configuration):
if (!initialFitDone.current) {
    setTimeout(() => { fg.zoomToFit?.(450, 50); initialFitDone.current = true; }, 80);
}
```

---

## Step 5 — 3D graph integration (`GraphNetwork3D.tsx`)

```tsx
import { useGraph3DWorker } from '../hooks/useGraph3DWorker';

// inside GraphNetwork3D:
const {
    isSimulating: workerSimulating,
    disableInternalSim,
    dragHandlers: workerDragHandlers,
} = useGraph3DWorker({
    graphData:      cleanData,
    config:         { repulsion: physicsConfig.repulsion, linkDistance },
    fgRef,
    groupCentroids, // pass the same groupCentroids memo you already compute
});

// ── In the orbital useEffect tick callback:
if (physicsSettlingRef.current || workerSimulatingRef.current) {
    fg.refresh?.();
    orbitRafRef.current = requestAnimationFrame(tick);
    return;
}

// ── On <ForceGraph3D>:
<ForceGraph3D
    {...existingProps}
    {...disableInternalSim}
    onNodeDrag={(node) => { handleNodeDrag(node); workerDragHandlers.onNodeDrag(node); }}
    onNodeDragEnd={(node) => { handleNodeDragEnd(node); workerDragHandlers.onNodeDragEnd(node); }}
/>
```

Remove the `fg.d3Force(...)` block in the physics `useEffect` the same way as Step 4.

---

## Step 6 — Restart worker on large data changes

The hooks already restart the worker when `graphData.nodes.length` changes.
For a "full replace" scenario (e.g. after an import), signal the hook by
calling `workerReheat()` or by temporarily setting a key prop:

```tsx
// Option A — explicit reheat after import
const handleImportComplete = useCallback((newData) => {
    setGraphData(newData);
    // The length change triggers a worker restart automatically via useEffect.
    // For same-length data, call reheat manually:
    workerReheat(1.0);  // full alpha restart
}, [workerReheat]);

// Option B — force a restart by resetting a key
const [graphKey, setGraphKey] = useState(0);
// ...
setGraphKey(k => k + 1); // causes component remount → new worker
<GraphNetwork key={graphKey} ... />
```

---

## TypeScript: window/document in the worker

`/// <reference lib="webworker" />` at the top of each worker file replaces
the `dom` lib with the `webworker` lib. This means:

- `window`  → **TypeScript error** (correct — it doesn't exist in a worker)
- `document` → **TypeScript error** (correct)
- `self`    → typed as `DedicatedWorkerGlobalScope` ✓
- All d3-force imports work because d3-force is **pure math** — no DOM access

If you import any utility that accidentally references `window` (e.g. a toast
library), you'll get a compile-time error pointing you exactly to the problem.

---

## Performance notes

| Concern | Solution |
|---------|----------|
| `postMessage` overhead | Positions sent as `Float32Array` with buffer **transfer** (zero-copy) |
| GC pressure | A new `Float32Array` is allocated each tick; the previous tick's buffer is transferred (freed on the worker side). GC stays low. |
| Too many ticks | `TICKS_PER_FRAME = 3` advances the sim faster than real-time; reduce to `1` for smoother incremental updates |
| Worker crashes silently | `w.onerror` logs and sets `isSimulating = false` so the orbital animation can take over |
| SharedArrayBuffer | Not used — requires `COOP`/`COEP` headers. `postMessage + transfer` achieves the same zero-copy with no server config |
