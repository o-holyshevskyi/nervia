/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface Particle {
    id: number;
    x: number;
    y: number;
}

interface AIStatusBarProps {
    isVisible: boolean;
    current: number;
    total: number;
    failed?: number;
    label?: string;
}

export default function AIStatusBar({ isVisible, current, total, label, failed }: AIStatusBarProps) {
    const [visualPercent, setVisualPercent] = useState(0);
    const [isDone, setIsDone] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const creepInterval = useRef<NodeJS.Timeout | null>(null);
    const particleIdCounter = useRef(0);

    const realPercent = total > 0 ? Math.round((current / total) * 100) : 0;

    // --- ГЕНЕРАЦІЯ ЧАСТОК ---
    useEffect(() => {
        if (!isVisible || isDone) {
            setParticles([]);
            return;
        }

        const interval = setInterval(() => {
            const newParticle = {
                id: particleIdCounter.current++,
                x: Math.random() * 20 - 10, // Випадковий розкид по горизонталі
                y: Math.random() * 20 - 10, // Випадковий розкид по вертикалі
            };
            setParticles(prev => [...prev.slice(-15), newParticle]); // Тримаємо максимум 15 часток
        }, 150);

        return () => clearInterval(interval);
    }, [isVisible, isDone]);

    // --- ЛОГІКА ПРОГРЕСУ (Асимптота) ---
    useEffect(() => {
        if (!isVisible) {
            setVisualPercent(0);
            setIsDone(false);
            if (creepInterval.current) clearInterval(creepInterval.current);
            return;
        }

        if (total <= 1) {
            const timers = [
                setTimeout(() => setVisualPercent(15), 600),
                setTimeout(() => setVisualPercent(45), 1200),
                setTimeout(() => setVisualPercent(82), 2500),
                setTimeout(() => startCreeping(82), 2600)
            ];
            return () => {
                timers.forEach(clearTimeout);
                if (creepInterval.current) clearInterval(creepInterval.current);
            };
        } else {
            setVisualPercent(realPercent);
            if (realPercent >= 90 && realPercent < 100) startCreeping(realPercent);
            else if (creepInterval.current) clearInterval(creepInterval.current);
        }
    }, [isVisible, realPercent, total]);

    const startCreeping = (start: number) => {
        if (creepInterval.current) clearInterval(creepInterval.current);
        setVisualPercent(start);
        creepInterval.current = setInterval(() => {
            setVisualPercent(prev => prev >= 99.5 ? 99.5 : prev + (100 - prev) * 0.02);
        }, 1000);
    };

    useEffect(() => {
        if (isVisible && current > 0 && current === total) {
            if (creepInterval.current) clearInterval(creepInterval.current);
            setVisualPercent(100);
            setTimeout(() => setIsDone(true), 600);
        }
    }, [current, total, isVisible]);

    const displayPercent = isDone ? 100 : Math.max(visualPercent, realPercent);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 pointer-events-none"
                >
                    <div className="bg-neutral-900/95 backdrop-blur-2xl border border-purple-500/30 p-4 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.4)] pointer-events-auto relative overflow-hidden">
                        
                        <div className="flex items-center justify-between mb-3 relative z-10">
                            <div className="flex items-center gap-2">
                                {isDone ? (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                        <CheckCircle2 className="text-green-400" size={18} />
                                    </motion.div>
                                ) : (
                                    <Sparkles className="text-purple-400 animate-pulse" size={16} />
                                )}
                                <span className="text-xs font-bold text-white uppercase tracking-widest leading-none">
                                    {isDone ? 'Sync Complete' : (label || 'Neural Processing')}
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                                {Math.floor(displayPercent)}% {total > 1 && !isDone && `(${current}/${total})`}
                            </span>
                            {/* {failed !== undefined && failed > 0 && (
                                <motion.span 
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-[9px] text-orange-400 mt-1 font-medium"
                                >
                                    {failed} skipped
                                </motion.span>
                            )} */}
                        </div>
                        
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                            {/* Смужка прогресу */}
                            <motion.div 
                                className={`h-full relative ${isDone ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-gradient-to-r from-purple-600 via-purple-400 to-indigo-500'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${displayPercent}%` }}
                                transition={{ type: "spring", stiffness: 45, damping: 20 }}
                            >
                                {/* {!isDone && (
                                    <motion.div 
                                        animate={{ x: ['0%','100%', '200%', '300%', '400%'] }}
                                        transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
                                        className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
                                    />
                                )} */}

                                {/* 🔥 Система часток (вилітають з кінця смужки) */}
                                {!isDone && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                        {particles.map((p) => (
                                            <motion.div
                                                key={p.id}
                                                initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                                                animate={{ opacity: 0, scale: 0, x: p.x + 20, y: p.y }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                                className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]"
                                            />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.p 
                                key={isDone ? 'done' : 'work'}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="mt-3 text-[14px] text-neutral-400 text-center italic font-medium"
                            >
                                {isDone 
                                    ? (failed && failed > 0 
                                        ? `Sync finished. ${total - failed} nodes updated, ${failed} skipped.` 
                                        : 'The semantic universe has been successfully synchronized.')
                                    : (label?.includes('Import') ? 'Weaving global neural connections...' : 'Analyzing semantic patterns...')}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}