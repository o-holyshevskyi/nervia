/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useMemo, useState } from "react";
import GraphNetwork from "@/src/components/GraphNetwork";
import Sidebar from "@/src/components/Sidebar";
import AddModal from "@/src/components/AddModal";
import type { NodeData } from "@/src/components/AddModal";
import PhysicsControl, { PhysicsConfig } from "@/src/components/PhysicsControl";
import ContextMenu from "@/src/components/ui/ContextMenu";
import { initialNodes, initialLinks, mockGroups } from "@/src/lib/mockDemoData";
import { Eye, PanelLeftOpen, Plus, Settings2, Sun, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Group } from "@/src/hooks/useGroups";

/** Demo-only groups compatible with Sidebar (Group has user_id, sort_order). */
const demoGroups: Group[] = mockGroups.map((g, i) => ({
  id: g.id,
  user_id: "demo",
  name: g.name,
  color: g.color,
  sort_order: i,
}));

export default function DemoUniverse() {
  const [graphData, setGraphData] = useState({ nodes: initialNodes, links: initialLinks });
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [zenModeNodeId, setZenModeNodeId] = useState<string | null>(null);
  const [solarSystemNodeId, setSolarSystemNodeId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [physicsConfig, setPhysicsConfig] = useState<PhysicsConfig>({ repulsion: 150, linkDistance: 60 });
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const [pathData, setPathData] = useState<{ nodes: string[]; links: any[] }>({ nodes: [], links: [] });
  const [clusterMode, setClusterMode] = useState<"group" | "tag">("group");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [physicsPanelOpen, setPhysicsPanelOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0, node: null as any | null });
  const [addError, setAddError] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    graphData.nodes.forEach((n: any) => (n.tags || []).forEach((t: string) => set.add(t)));
    return Array.from(set);
  }, [graphData.nodes]);

  const toggleZenMode = useCallback((nodeId: string) => {
    setZenModeNodeId((prev) => (prev === nodeId ? null : nodeId));
    if (zenModeNodeId !== nodeId) setFocusedNodeId(nodeId);
  }, [zenModeNodeId]);

  const handleNodeContextMenu = useCallback((node: any, event: MouseEvent) => {
    setContextMenu({ isOpen: true, x: event.clientX, y: event.clientY, node });
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setGraphData((prev) => ({
      nodes: prev.nodes.filter((n: any) => (typeof n.id === "string" ? n.id : n.id?.id) !== nodeId),
      links: prev.links.filter((l: any) => {
        const s = typeof l.source === "string" ? l.source : l.source?.id;
        const t = typeof l.target === "string" ? l.target : l.target?.id;
        return s !== nodeId && t !== nodeId;
      }),
    }));
    setSelectedNode(null);
    setFocusedNodeId(null);
    setZenModeNodeId((p) => (p === nodeId ? null : p));
    setSolarSystemNodeId((p) => (p === nodeId ? null : p));
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleAddNode = useCallback(
    (nodeData: NodeData) => {
      setAddError(null);
      const existingIdSet = new Set(
        graphData.nodes.map((n: any) => (typeof n.id === "string" ? n.id : n.id?.id)).filter(Boolean)
      );
      const validTargetIds = (nodeData.connections || [])
        .map((id) => String(id))
        .filter((id) => existingIdSet.has(id));
      let group = 1;
      if (nodeData.type === "link") group = 1;
      if (nodeData.type === "note") group = 2;
      if (nodeData.type === "idea") group = 3;
      const newId = crypto.randomUUID();
      const newNode = {
        id: newId,
        title: nodeData.title,
        group,
        val: 5,
        type: nodeData.type,
        url: nodeData.url ?? "",
        tags: nodeData.tags,
        content: nodeData.content ?? "",
        created_at: new Date().toISOString(),
      };
      const newLinks: any[] = validTargetIds.map((targetId) => ({
        source: newId,
        target: targetId,
        relationType: nodeData.autoConnectAI ? "ai" : "manual",
        label: nodeData.autoConnectAI ? "AI connection" : "Manual connection",
        weight: 1,
      }));
      setGraphData((prev) => ({
        nodes: [...prev.nodes, newNode],
        links: [...prev.links, ...newLinks],
      }));
      setIsAddModalOpen(false);
    },
    [graphData.nodes]
  );

  const updateNode = useCallback(
    (nodeId: string, newData: { title?: string; content?: string; tags?: string[]; url?: string; group_id?: string | null }) => {
      setGraphData((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n: any) => {
          const id = typeof n.id === "string" ? n.id : n.id?.id;
          if (id !== nodeId) return n;
          return { ...n, ...newData };
        }),
      }));
    },
    []
  );

  const addLink = useCallback((sourceId: string, targetId: string) => {
    setGraphData((prev) => {
      const exists = prev.links.some((l: any) => {
        const s = typeof l.source === "string" ? l.source : l.source?.id;
        const t = typeof l.target === "string" ? l.target : l.target?.id;
        return (s === sourceId && t === targetId) || (s === targetId && t === sourceId);
      });
      if (exists) return prev;
      return {
        ...prev,
        links: [
          ...prev.links,
          { source: sourceId, target: targetId, relationType: "manual", label: "Manual connection", weight: 1 },
        ],
      };
    });
  }, []);

  const deleteLink = useCallback((sourceId: string, targetId: string) => {
    setGraphData((prev) => ({
      ...prev,
      links: prev.links.filter((l: any) => {
        const s = typeof l.source === "string" ? l.source : l.source?.id;
        const t = typeof l.target === "string" ? l.target : l.target?.id;
        return !(s === sourceId && t === targetId) && !(s === targetId && t === sourceId);
      }),
    }));
  }, []);

  const onAddGroup = useCallback(async (_name: string, _color: string): Promise<Group | null> => {
    return null;
  }, []);

  return (
    <main className="bg-white dark:bg-neutral-950 flex min-h-screen flex-col items-center justify-between relative">
      <div className="absolute inset-0" aria-hidden="true">
        <GraphNetwork
          onNodeSelect={(node) => {
            setSelectedNode(node);
            setFocusedNodeId(typeof node.id === "string" ? node.id : node.id?.id);
          }}
          graphData={graphData}
          activeTag={activeTag}
          focusedNodeId={focusedNodeId}
          zenModeNodeId={zenModeNodeId}
          physicsConfig={physicsConfig}
          highlightedNodes={highlightedNodes}
          pathNodes={pathData.nodes}
          pathLinks={pathData.links}
          flyToNodeId={null}
          onFlyToComplete={() => {}}
          onNodeContextMenu={handleNodeContextMenu}
          onBackgroundClick={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
          solarSystemNodeId={solarSystemNodeId}
          clusterMode={clusterMode}
          groups={mockGroups}
          renderToolbarExtra={(buttonClassName) => (
            <button
              type="button"
              onClick={() => setPhysicsPanelOpen(true)}
              className={buttonClassName}
              title="Physics of the Universe"
              aria-label="Physics settings"
            >
              <Settings2 size={18} />
            </button>
          )}
        />
      </div>

      {!isLeftSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsLeftSidebarOpen(true)}
          className="absolute top-[7.5rem] left-8 z-20 w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-md bg-white/[0.03] border border-white/5 text-neutral-400 dark:text-neutral-500 hover:bg-white/10 hover:text-white transition-all duration-300 ease-out cursor-pointer"
          aria-label="Open sidebar"
        >
          <PanelLeftOpen size={20} />
        </button>
      )}

      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        <AnimatePresence>
          {activeTag !== null && (
            <motion.button
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              key="clear-filter"
              onClick={() => setActiveTag(null)}
              className="hover:cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-500/20 dark:bg-purple-500/20 backdrop-blur-md border border-indigo-500/50 dark:border-purple-500/50 rounded-full text-indigo-700 dark:text-purple-300 hover:bg-indigo-500/40 dark:hover:bg-purple-500/40 hover:text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] dark:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            >
              <span className="text-sm font-medium">Clear Filter: {activeTag}</span>
              <X size={14} className="opacity-70" />
            </motion.button>
          )}
          {zenModeNodeId !== null && (
            <motion.button
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              key="zen-mode"
              onClick={() => setZenModeNodeId(null)}
              className="hover:cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-500/20 backdrop-blur-md border border-indigo-500/50 rounded-full text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/40 hover:text-white shadow-[0_0_20px_rgba(99,102,241,0.25)] dark:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              <Eye size={14} className="opacity-70" />
              <span className="text-sm font-medium">Exit Zen Mode</span>
            </motion.button>
          )}
          {solarSystemNodeId !== null && (
            <motion.button
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              key="deep-focus"
              onClick={() => setSolarSystemNodeId(null)}
              className="hover:cursor-pointer flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur-md border border-amber-500/50 rounded-full text-amber-800 dark:text-amber-300 hover:bg-amber-500/40 hover:text-white shadow-[0_0_20px_rgba(245,158,11,0.25)] dark:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              <Sun size={14} className="opacity-70" />
              <span className="text-sm font-medium">Exit Deep Focus</span>
              <X size={14} className="opacity-70" />
            </motion.button>
          )}
          {pathData.nodes.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              key="clear-path"
              onClick={() => setPathData({ nodes: [], links: [] })}
              className="hover:cursor-pointer flex items-center gap-2 px-4 py-2 bg-cyan-500/20 backdrop-blur-md border border-cyan-500/50 rounded-full text-cyan-800 dark:text-cyan-300 hover:bg-cyan-500/40 hover:text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] dark:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              <span className="text-sm font-medium">Clear Path</span>
              <X size={14} className="opacity-70" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        isActiveTag={activeTag !== null}
        x={contextMenu.x}
        y={contextMenu.y}
        node={contextMenu.node}
        isZenModeActive={zenModeNodeId !== null}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        onDeepFocus={(nodeId) => setSolarSystemNodeId(nodeId)}
        onZenMode={toggleZenMode}
        onEdit={(node) => setSelectedNode(node)}
        onDelete={(nodeId) => deleteNode(nodeId)}
      />

      {isLeftSidebarOpen && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="absolute top-24 left-6 z-20 w-56 rounded-2xl backdrop-blur-xl bg-white/5 dark:bg-neutral-900/60 border border-white/10 dark:border-white/10 shadow-xl p-4 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Demo</span>
            <button
              type="button"
              onClick={() => setIsLeftSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 dark:bg-purple-600 dark:hover:bg-purple-500 text-white text-sm font-medium transition-all cursor-pointer"
          >
            <Plus size={18} />
            New Neuron
          </button>
          {allTags.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Filter by tag</p>
              <div className="flex flex-wrap gap-1.5">
                {allTags.slice(0, 8).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeTag === tag
                        ? "bg-indigo-500/30 dark:bg-purple-500/30 text-indigo-800 dark:text-purple-200"
                        : "bg-white/10 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-white/20 dark:hover:bg-white/10"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      <Sidebar
        selectedNode={selectedNode}
        onClose={() => setSelectedNode(null)}
        onUpdateNode={updateNode}
        allNodes={graphData}
        onAddLink={addLink}
        onDeleteLink={deleteLink}
        groups={demoGroups}
        onAddGroup={onAddGroup}
      />

      <AddModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddError(null);
        }}
        onAdd={handleAddNode}
        existingNodes={graphData.nodes}
        allTags={allTags}
        submitError={addError}
      />

      <PhysicsControl config={physicsConfig} onChange={setPhysicsConfig} open={physicsPanelOpen} onOpenChange={setPhysicsPanelOpen} />

      <motion.button
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full backdrop-blur-2xl bg-black/40 dark:bg-neutral-900/50 border border-white/10 text-white font-medium tracking-wide flex items-center gap-2 shadow-[0_0_30px_rgba(99,102,241,0.15)] dark:shadow-[0_0_30px_rgba(168,85,247,0.15)] cursor-pointer z-20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Plus size={18} className="text-indigo-400 dark:text-purple-400 shrink-0" />
        <span>New Neuron</span>
      </motion.button>
    </main>
  );
}
