"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import { toast } from "sonner";
import CloseButton from "./ui/CloseButton";

interface MissionFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MissionFeedbackModal({ isOpen, onClose }: MissionFeedbackModalProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to send feedback.");
        return;
      }
      toast.success("Feedback sent to Houston.");
      setMessage("");
      onClose();
    } catch {
      toast.error("Failed to send feedback.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/20 dark:bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 p-6 shadow-xl backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold tracking-widest text-neutral-800 dark:text-neutral-200 uppercase">
                Mission Feedback
              </h3>
              <CloseButton onClose={handleClose} size={18} />
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Found a bug or have an idea for the knowledge graph? Let us know.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="feedback-message" className="sr-only">
                  Your message
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your feedback..."
                  rows={4}
                  required
                  disabled={isLoading}
                  className="w-full resize-none rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50/80 dark:bg-white/5 px-3 py-2.5 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-indigo-500 dark:focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 dark:focus:ring-purple-500/50 disabled:opacity-60"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="cursor-pointer px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className="hover:cursor-pointer inline-flex items-center gap-2 rounded-lg bg-indigo-600 dark:bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-purple-500/50 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Send size={16} />
                  )}
                  Send to Houston
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
