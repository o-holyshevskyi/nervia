'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    type?: 'info' | 'success' | 'warning';
}

export default function ConfirmModal({ 
    isOpen, onClose, onConfirm, title, description, 
    confirmText = "Confirm", type = 'info' 
}: ConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-sm bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 p-6 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 dark:bg-purple-500/10 blur-3xl rounded-full" />
                        
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border ${
                                type === 'info' ? 'bg-indigo-500/10 dark:bg-purple-500/10 border-indigo-500/20 dark:border-purple-500/20 text-indigo-600 dark:text-purple-400' :
                                'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                            }`}>
                                {type === 'info' ? <AlertCircle size={28} /> : <CheckCircle2 size={28} />}
                            </div>

                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">{title}</h3>
                            <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed mb-8">
                                {description}
                            </p>

                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={onClose}
                                    className="cursor-pointer flex-1 px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 text-neutral-900 dark:text-white font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => { onConfirm(); onClose(); }}
                                    className="cursor-pointer flex-[2] px-4 py-3 rounded-xl bg-indigo-600 dark:bg-purple-600 text-white font-bold hover:bg-indigo-500 dark:hover:bg-purple-500 transition-all shadow-lg shadow-indigo-900/20 dark:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}