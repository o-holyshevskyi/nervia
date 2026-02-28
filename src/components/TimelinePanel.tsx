"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Clock } from "lucide-react";
import CloseButton from "./ui/CloseButton";

export const PLAYBACK_DURATION_OPTIONS = [
    { label: "30s", seconds: 30 },
    { label: "1 min", seconds: 60 },
    { label: "1.5 min", seconds: 90 },
    { label: "2 min", seconds: 120 },
] as const;

export interface TimelinePanelProps {
    datePoints: number[];
    currentDate: number;
    onChange: (date: number) => void;
    isPlaying: boolean;
    onTogglePlay: () => void;
    playbackDurationSeconds: number;
    onPlaybackDurationChange: (seconds: number) => void;
    onClose: () => void;
}

function findCurrentStep(datePoints: number[], currentDate: number): number {
    if (datePoints.length === 0) return 0;
    let step = 0;
    for (let i = 0; i < datePoints.length; i++) {
        if (datePoints[i]! <= currentDate) step = i;
    }
    return step;
}

export default function TimelinePanel({
    datePoints,
    currentDate,
    onChange,
    isPlaying,
    onTogglePlay,
    playbackDurationSeconds,
    onPlaybackDurationChange,
    onClose,
}: TimelinePanelProps) {
    const hasNoPoints = datePoints.length === 0;
    const isSinglePoint = datePoints.length <= 1;
    const currentStep = findCurrentStep(datePoints, currentDate);
    const displayDate = hasNoPoints
        ? "-"
        : new Date(datePoints[currentStep] ?? currentDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
          });

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-8 right-8 z-[80] w-[360px] rounded-2xl bg-white/90 dark:bg-neutral-900/80 backdrop-blur-2xl border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)] dark:shadow-[0_0_40px_rgba(245,158,11,0.2)] p-5"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Clock size={20} className="text-amber-500 dark:text-amber-400" />
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">Time Machine</span>
                    </div>
                    <CloseButton onClose={onClose} size={20} />
                </div>

                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                    Replay how your neurons grew over time. <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-500">Ctrl+Alt+T</span>
                </p>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onTogglePlay}
                            disabled={hasNoPoints || isSinglePoint}
                            className="cursor-pointer flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-500/20"
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? (
                                <Pause size={20} className="text-amber-700 dark:text-amber-300" />
                            ) : (
                                <Play size={20} className="text-amber-700 dark:text-amber-300 ml-0.5" />
                            )}
                        </button>
                        <div className="flex-1 min-w-0">
                            <label className="block text-xs font-medium text-amber-600/90 dark:text-amber-400/90 mb-1.5">
                                Current date
                            </label>
                            <span className="text-sm font-medium text-neutral-900 dark:text-white tabular-nums">
                                {displayDate}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-amber-600/90 dark:text-amber-400/90 mb-1.5">
                            Playback speed
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {PLAYBACK_DURATION_OPTIONS.map(({ label, seconds }) => (
                                <button
                                    key={seconds}
                                    type="button"
                                    onClick={() => onPlaybackDurationChange(seconds)}
                                    className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        playbackDurationSeconds === seconds
                                            ? "bg-amber-500/30 text-amber-800 dark:text-amber-200 border border-amber-500/50"
                                            : "bg-black/20 dark:bg-black/40 text-neutral-600 dark:text-neutral-400 border border-amber-500/20 hover:text-amber-700 dark:hover:text-amber-300 hover:border-amber-500/30"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-amber-600/90 dark:text-amber-400/90 mb-1.5">
                            Scrub timeline
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={Math.max(0, datePoints.length - 1)}
                            value={currentStep}
                            step={1}
                            onChange={(e) => {
                                const idx = Number(e.target.value);
                                const date = datePoints[idx];
                                if (date != null) onChange(date);
                            }}
                            disabled={isSinglePoint || hasNoPoints}
                            className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer border border-amber-500/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                        />
                        {!hasNoPoints && (
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-500 mt-1">
                                {datePoints.length} date point{datePoints.length !== 1 ? "s" : ""}
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
