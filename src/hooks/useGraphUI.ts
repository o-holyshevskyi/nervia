/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';

export function useGraphUI() {
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
    const [zenModeNodeId, setZenModeNodeId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0, node: null as any });

    const toggleZenMode = (nodeId: string) => {
        setZenModeNodeId(prev => prev === nodeId ? null : nodeId);
        setFocusedNodeId(nodeId);
    };

    const closeAll = () => {
        setSelectedNode(null);
        setIsAddModalOpen(false);
        setContextMenu(prev => ({ ...prev, isOpen: false }));
    };

    return {
        ui: { selectedNode, isAddModalOpen, isLeftSidebarOpen, activeTag, focusedNodeId, zenModeNodeId, contextMenu },
        setUI: { 
            setSelectedNode, setIsAddModalOpen, setIsLeftSidebarOpen, 
            setActiveTag, setFocusedNodeId, setZenModeNodeId, setContextMenu 
        },
        toggleZenMode,
        closeAll
    };
}