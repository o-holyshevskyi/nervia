'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Package, CheckCircle2, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useExtensionDetected } from '@/src/hooks/useExtensionDetected';

const REDIRECT_DELAY_MS = 2000;
// ЗАМІНИ НА СВІЙ ЛІНК, КОЛИ GOOGLE ОПУБЛІКУЄ РОЗШИРЕННЯ
const CHROME_STORE_URL = 'https://chrome.google.com/webstore/detail/ТВІЙ_ID_РОЗШИРЕННЯ'; 

export default function ExtensionPage() {
  const detected = useExtensionDetected();

  useEffect(() => {
    if (!detected) return;
    const t = setTimeout(() => {
      window.location.href = '/';
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(t);
  }, [detected]);

  return (
    <main className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-lg bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl shadow-xl dark:shadow-2xl relative z-10 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {detected ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-10 flex flex-col items-center justify-center text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.25)]">
                <CheckCircle2 size={40} className="text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Success!</h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
                Web Clipper is active. Redirecting to your dashboard…
              </p>
              <div className="h-1.5 w-32 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-green-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: REDIRECT_DELAY_MS / 1000, ease: 'linear' }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="guide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 md:p-10"
            >
              <div className="flex justify-center mb-8">
                <div className="w-16 h-16 bg-indigo-500/20 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 dark:border-purple-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)] dark:shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                  <Package className="text-indigo-600 dark:text-purple-400" size={32} />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white text-center mb-2 tracking-tight">
                Install Nervia Web Clipper
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm text-center mb-10">
                Transform any page into a Neuron in your 3D universe.
              </p>

              {/* Головна кнопка: Chrome Store */}
              <div className="space-y-4 mb-8">
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:cursor-pointer flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-purple-600 text-white hover:bg-purple-500 font-semibold transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                >
                  <ExternalLink size={20} />
                  Add to Chrome (Official Store)
                </a>
              </div>

              {/* Альтернатива: Ручне встановлення */}
              <div className="relative flex items-center py-5">
                <div className="flex-grow border-t border-black/10 dark:border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-xs text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-black/10 dark:border-white/10"></div>
              </div>

              <div className="text-center">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                  Are you a beta tester or developer?
                </p>
                <a
                  href="/api/extension/download"
                  download="nervia-web-clipper.zip"
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-purple-400 hover:text-indigo-800 dark:hover:text-purple-300 transition-colors"
                >
                  <Download size={14} />
                  Download ZIP manually
                </a>
              </div>

              <Link
                href="/"
                className="hover:cursor-pointer mt-10 flex items-center justify-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                Back to dashboard
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}