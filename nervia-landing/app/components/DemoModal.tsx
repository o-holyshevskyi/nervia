"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { APP_URL } from "../lib/app-url";

interface DemoModalProps {
  onClose: () => void;
}

export function DemoModal({ onClose }: DemoModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close demo"
      />

      {/* Modal panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-[95vw] h-[95vh] max-w-[1800px] max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black/60 backdrop-blur-3xl flex flex-col"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Banner */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-sm">
          <span className="text-slate-300">
            You are exploring a demo universe. Changes will not be saved.
          </span>
          <Link
            href={`${APP_URL}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-medium transition-colors"
          >
            Sign Up to Save
          </Link>
        </div>

        {/* Iframe: demo content */}
        <div className="flex-1 min-h-0 pt-14">
          <iframe
            src={`${APP_URL}/demo`}
            title="Nervia demo"
            className="w-full h-full rounded-b-3xl border-0 bg-neutral-950"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
