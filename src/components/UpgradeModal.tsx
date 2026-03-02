"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Sparkles, Infinity, Route, Filter, Download, Share2, Box, MessageCircle, Clock, History } from "lucide-react";
import CloseButton from "./ui/CloseButton";

/** Constellation: matches billing — Unlimited Neurons, Pathfinder & Zen, Tags & Filters, Import/Export, more shares. */
const CONSTELLATION_FEATURES = [
  { icon: Infinity, text: "Unlimited Neurons" },
  { icon: Route, text: "Pathfinder & Zen Mode" },
  { icon: Filter, text: "Tags & Advanced Filters" },
  { icon: Download, text: "Data Import/Export" },
  { icon: Share2, text: "Up to 5 shares" },
];

/** Singularity: Full AI Neural Core, Semantic Search, 3D, Time Machine, Evolution Journal, Unlimited Shared Universes + Constellation. */
const SINGULARITY_FEATURES = [
  { icon: MessageCircle, text: "Full AI Neural Core (Chat & Search)" },
  { icon: Sparkles, text: "AI Semantic Search" },
  { icon: Box, text: "3D Graph Visualization" },
  { icon: Clock, text: "Time Machine & Evolution Journal" },
  { icon: Share2, text: "Unlimited shares" },
  { icon: Infinity, text: "All Constellation features" },
];

export type UpgradeTargetPlan = "constellation" | "singularity";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Which plan to promote; drives title, description, list, CTA, and styling. */
  targetPlan?: UpgradeTargetPlan;
  /** Optional override for description (e.g. 3D switcher: "Unlock the 3D Perspective..."). */
  descriptionOverride?: string;
}

export default function UpgradeModal({ isOpen, onClose, targetPlan = "constellation", descriptionOverride }: UpgradeModalProps) {
  const isSingularity = targetPlan === "singularity";

  const title = isSingularity ? "Unlock the Singularity Perspective" : "Upgrade to Constellation";
  const description = descriptionOverride ?? (isSingularity
    ? "Experience your universe in 3D and get priority AI processing."
    : "Unlock unlimited neurons and premium features to grow your knowledge graph without limits.");
  const features = isSingularity ? SINGULARITY_FEATURES : CONSTELLATION_FEATURES;
  const ctaText = isSingularity ? "Get Singularity — $7.99" : "Get Constellation — $3.99";

  const modalClassName = isSingularity
    ? "fixed left-1/2 top-1/2 z-[201] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-amber-500/30 dark:border-amber-400/20 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl shadow-[0_0_60px_rgba(168,85,247,0.25)] dark:shadow-[0_0_80px_rgba(168,85,247,0.3),0_0_40px_rgba(251,191,36,0.15)] p-6"
    : "fixed left-1/2 top-1/2 z-[201] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/20 dark:border-purple-500/20 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl shadow-[0_0_60px_rgba(168,85,247,0.15)] dark:shadow-[0_0_60px_rgba(168,85,247,0.2)] p-6";

  const iconWrapperClassName = isSingularity
    ? "w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/25 to-amber-500/20 border border-amber-500/30 flex items-center justify-center shadow-[0_0_24px_rgba(168,85,247,0.3),0_0_16px_rgba(251,191,36,0.15)]"
    : "w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.2)]";

  const ctaClassName = isSingularity
    ? "hover:cursor-pointer flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-medium text-white bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 shadow-[0_0_28px_rgba(168,85,247,0.45),0_0_16px_rgba(251,191,36,0.2)] hover:shadow-[0_0_36px_rgba(168,85,247,0.5),0_0_20px_rgba(251,191,36,0.25)] transition-all"
    : "hover:cursor-pointer flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-medium text-white bg-purple-500 hover:bg-purple-600 shadow-[0_0_24px_rgba(168,85,247,0.4)] hover:shadow-[0_0_32px_rgba(168,85,247,0.5)] transition-all";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/30 dark:bg-black/50 backdrop-blur-sm"
            aria-hidden
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={modalClassName}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-modal-title"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className={`${iconWrapperClassName}`}>
                  <Sparkles className={isSingularity ? "text-amber-400 dark:text-amber-300" : "text-purple-500 dark:text-purple-400"} size={22} />
                </div>
                <h2 id="upgrade-modal-title" className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {title}
                </h2>
              </div>
              <CloseButton onClose={onClose} size={20} />
            </div>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              {description}
            </p>

            <ul className="space-y-2 mb-6">
              {features.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-2.5 text-sm text-neutral-700 dark:text-neutral-300"
                >
                  <Icon size={16} className={isSingularity ? "text-amber-500 dark:text-amber-400 shrink-0" : "text-purple-500 dark:text-purple-400 shrink-0"} />
                  {text}
                </li>
              ))}
            </ul>

            <Link
              href="/settings/billing"
              onClick={onClose}
              className={ctaClassName}
            >
              {ctaText}
            </Link>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
