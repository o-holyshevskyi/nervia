"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Settings2, X, Magnet, Activity } from "lucide-react";

export interface PhysicsConfig {
    repulsion: number;
    linkDistance: number;
}

interface PhysicsControlProps {
    config: PhysicsConfig;
    onChange: (config: PhysicsConfig) => void;
}

export default function PhysicsControl({ config, onChange }: PhysicsControlProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute bottom-10 right-10 z-40">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-16 right-0 w-72 bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl mb-4"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Settings2 size={18} className="text-purple-400" />
                                Physics of the Universe
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium uppercase tracking-wider">
                                        <Magnet size={14} className="text-blue-400" /> Repulsion
                                    </label>
                                    <span className="text-xs text-neutral-300 font-mono">{config.repulsion}</span>
                                </div>
                                <input
                                    type="range"
                                    min="100"
                                    max="5000"
                                    step="10"
                                    value={config.repulsion}
                                    onChange={(e) => onChange({ ...config, repulsion: Number(e.target.value) })}
                                    className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium uppercase tracking-wider">
                                        <Activity size={14} className="text-green-400" /> Bond length
                                    </label>
                                    <span className="text-xs text-neutral-300 font-mono">{config.linkDistance}</span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="200"
                                    step="5"
                                    value={config.linkDistance}
                                    onChange={(e) => onChange({ ...config, linkDistance: Number(e.target.value) })}
                                    className="w-full accent-green-500 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                        
                        <p className="text-[10px] text-neutral-500 mt-5 text-center italic">
                            Changes are applied in real time
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center justify-center w-12 h-12 bg-neutral-900/60 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/10 hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] group"
                >
                    <Settings2 size={20} className="text-neutral-400 group-hover:text-purple-400 transition-colors" />
                </button>
            )}
        </div>
    );
}