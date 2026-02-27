"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CloseButton from "./ui/CloseButton";

const DEFAULT_COLOR = "#64748b";

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, color: string) => void;
}

export default function CreateGroupModal({ isOpen, onClose, onCreate }: CreateGroupModalProps) {
    const [name, setName] = useState("");
    const [color, setColor] = useState(DEFAULT_COLOR);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        onCreate(trimmed, color);
        setName("");
        setColor(DEFAULT_COLOR);
        onClose();
    };

    const handleClose = () => {
        setName("");
        setColor(DEFAULT_COLOR);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40"
                        onClick={handleClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-xl z-50 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold tracking-widest text-neutral-700 dark:text-neutral-300 uppercase">
                                Create group
                            </h3>
                            <CloseButton onClose={handleClose} size={18} />
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Development, Reading"
                                    className="w-full px-3 py-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-purple-500/50"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                                    Color
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-black/10 dark:border-white/10 cursor-pointer bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white font-mono text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!name.trim()}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-purple-600 hover:bg-indigo-700 dark:hover:bg-purple-700 rounded-lg disabled:opacity-50 disabled:pointer-events-none transition-colors"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
