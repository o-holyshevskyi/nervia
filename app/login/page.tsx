'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Mail, Loader2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/src/lib/supabase/client';
import { NeuralBackground } from '@/src/components/NeuralBackground';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState<'google' | 'github' | 'email' | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Використовуємо наш клієнтський хелпер
    const supabase = createClient();

    const handleOAuth = async (provider: 'google' | 'github') => {
        setIsLoading(provider);
        setError(null);
        
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
            setIsLoading(null);
        }
    };

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading('email');
        setError(null);

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
        } else {
            setIsSuccess(true);
        }
        setIsLoading(null);
    };

    return (
        <main className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Фоновий ефект */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl shadow-xl dark:shadow-2xl relative z-10 overflow-hidden"
            >
                <div className="p-8 md:p-10">
                <div
                    className="flex justify-center mb-8 w-full relative rounded-xl overflow-hidden"
                    style={{ aspectRatio: '1900/1300' }}
                >
                    <NeuralBackground />
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tight">Welcome to Nervia</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">Sign in to access your visual intelligence universe</p>
                </div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-6"
                        >
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-sm font-medium">
                                <AlertCircle size={16} className="shrink-0" />
                                {error}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isSuccess ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center text-center p-4 bg-green-500/10 border border-green-500/20 rounded-2xl"
                    >
                        <CheckCircle2 size={40} className="text-green-600 dark:text-green-400 mb-3" />
                        <h3 className="text-neutral-900 dark:text-white font-medium mb-1">Check your email</h3>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm">We sent a magic link to <strong>{email}</strong></p>
                        <button 
                            onClick={() => setIsSuccess(false)}
                            className="cursor-pointer mt-6 text-sm text-indigo-600 dark:text-purple-400 hover:text-indigo-700 dark:hover:text-purple-300 font-medium transition-colors"
                        >
                            Try another way
                        </button>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <button
                            onClick={() => handleOAuth('google')}
                            disabled={isLoading !== null}
                            className="hover:cursor-pointer relative flex items-center justify-center w-full gap-3 px-4 py-3 bg-white text-neutral-900 font-semibold rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-black/10 dark:border-white/10"
                        >
                            {isLoading === 'google' ? <Loader2 size={18} className="animate-spin" /> : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                            )}
                            Continue with Google
                        </button>

                        <button
                            onClick={() => handleOAuth('github')}
                            disabled={isLoading !== null}
                            className="hover:cursor-pointer relative flex items-center justify-center w-full gap-3 px-4 py-3 bg-[#24292F] text-white font-semibold rounded-xl hover:bg-[#24292F]/90 dark:hover:bg-[#24292F]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-black/10 dark:border-white/10"
                        >
                            {isLoading === 'github' ? <Loader2 size={18} className="animate-spin" /> : <Github size={18} />}
                            Continue with GitHub
                        </button>

                        <div className="flex items-center gap-3 my-6">
                            <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                            <span className="text-xs font-medium text-neutral-500 uppercase tracking-widest">Or</span>
                            <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                        </div>

                        <form onSubmit={handleMagicLink} className="space-y-3">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    placeholder="name@example.com"
                                    className="w-full bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 dark:focus:border-purple-500/50 transition-colors"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading !== null || !email}
                                className="hover:cursor-pointer group flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-indigo-500/20 dark:bg-purple-500/20 border border-indigo-500/40 dark:border-purple-500/40 text-indigo-700 dark:text-purple-300 hover:bg-indigo-500/30 dark:hover:bg-purple-500/30 hover:text-indigo-900 dark:hover:text-white font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.15)] dark:shadow-[0_0_20px_rgba(168,85,247,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading === 'email' ? <Loader2 size={18} className="animate-spin" /> : (
                                    <>
                                        Send Magic Link
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
                </div>
            </motion.div>
        </main>
    );
}