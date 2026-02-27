/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Copy, Edit2, Trash2, Eye, Sun } from "lucide-react";
import { useEffect } from "react";

interface ContextMenuProps {
    isOpen: boolean;
    x: number;
    y: number;
    node: any | null;
    isZenModeActive: boolean;
    isActiveTag: boolean;
    onClose: () => void;
    onDeepFocus: (nodeId: string) => void;
    onEdit: (node: any) => void;
    onDelete: (nodeId: string) => void;
    onZenMode: (nodeId: string) => void;
}

export default function ContextMenu({ isOpen, x, y, node, isZenModeActive, isActiveTag, onClose, onDeepFocus, onEdit, onDelete, onZenMode }: ContextMenuProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    const menuX = typeof window !== 'undefined' && x > window.innerWidth - 200 ? x - 200 : x;
    const menuY = typeof window !== 'undefined' && y > window.innerHeight - 250 ? y - 200 : y;

    return (
        <AnimatePresence>
            {isOpen && node && (
                <>
                    <div className="fixed inset-0 z-[100]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed z-[101] w-48 bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col p-1.5"
                        style={{ left: menuX, top: menuY }}
                    >
                        <div className="px-3 py-2 border-b border-white/10 mb-1">
                            <p className="text-xs font-medium text-neutral-400 truncate">
                                {typeof node.id === 'string' ? node.id : node.id?.id}
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                onDeepFocus(typeof node.id === 'string' ? node.id : node.id?.id);
                                onClose();
                            }}
                            className="hover:cursor-pointer flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                        >
                            <Sun size={14} className="text-amber-400" /> Deep Focus
                        </button>

                        <button
                            onClick={() => {
                                onZenMode(typeof node.id === 'string' ? node.id : node.id?.id);
                                onClose();
                            }}
                            disabled={isActiveTag}
                            className={`${isActiveTag && 'opacity-50'} ${!isActiveTag && 'hover:cursor-pointer hover:text-white hover:bg-white/10'} flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 rounded-lg transition-colors text-left`}
                        >
                            <Eye size={14} className={isZenModeActive ? "text-purple-400" : "text-white"} /> 
                            {isZenModeActive ? "Disable Zen Mode" : "Zen Mode (Isolate)"}
                        </button>

                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(typeof node.id === 'string' ? node.id : node.id?.id);
                                onClose();
                            }}
                            className="hover:cursor-pointer flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                        >
                            <Copy size={14} className="text-green-400" /> Copy Name
                        </button>

                        <button
                            onClick={() => {
                                onEdit(node);
                                onClose();
                            }}
                            className="hover:cursor-pointer flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                        >
                            <Edit2 size={14} className="text-yellow-400" /> Edit
                        </button>

                        <div className="h-px bg-white/10 my-1" />

                        <button
                            onClick={() => {
                                onDelete(typeof node.id === 'string' ? node.id : node.id?.id);
                                onClose();
                            }}
                            className="hover:cursor-pointer flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                        >
                            <Trash2 size={14} /> Remove Neuron
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}