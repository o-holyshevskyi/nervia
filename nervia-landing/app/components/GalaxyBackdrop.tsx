"use client";

import { motion } from "framer-motion";
import { NeuralBackground } from "./NeuralBackground";

type Orbit = {
  label: string;
  sizePx: number;
  durationSec: number;
  direction: "cw" | "ccw";
  dashed?: boolean;
  align: "start" | "centerTop" | "end" | "centerBottom";
  dotClassName: string;
  labelClassName?: string;
};

const orbits: Orbit[] = [
  {
    label: "CORE",
    sizePx: 210,
    durationSec: 26,
    direction: "cw",
    dashed: true,
    align: "start",
    dotClassName: "w-2 h-2 bg-teal-500 shadow-[0_0_10px_2px_rgba(45,212,191,0.45)]",
    labelClassName: "-rotate-12",
  },
  {
    label: "SYNAPSE",
    sizePx: 360,
    durationSec: 42,
    direction: "ccw",
    align: "centerTop",
    dotClassName: "w-4 h-4 bg-orange-500 shadow-[0_0_15px_3px_rgba(249,115,22,0.45)]",
  },
  {
    label: "NEURAL_BRIDGE",
    sizePx: 520,
    durationSec: 58,
    direction: "cw",
    dashed: true,
    align: "end",
    dotClassName: "w-2.5 h-2.5 bg-pink-500 shadow-[0_0_12px_2px_rgba(236,72,153,0.45)]",
    labelClassName: "-rotate-45",
  },
  {
    label: "EXOCORTEX",
    sizePx: 690,
    durationSec: 74,
    direction: "ccw",
    align: "centerBottom",
    dotClassName: "w-3 h-3 bg-indigo-500 shadow-[0_0_15px_3px_rgba(99,102,241,0.45)]",
    labelClassName: "rotate-180",
  },
  {
    label: "PROXY_NODE",
    sizePx: 860,
    durationSec: 92,
    direction: "cw",
    dashed: true,
    align: "start",
    dotClassName:
      "w-3.5 h-3.5 bg-purple-500 shadow-[0_0_20px_4px_rgba(168,85,247,0.35)]",
    labelClassName: "-rotate-90",
  },
  {
    label: "DATA_UPLINK",
    sizePx: 1020,
    durationSec: 112,
    direction: "ccw",
    align: "centerTop",
    dotClassName: "w-2 h-2 bg-blue-500 shadow-[0_0_15px_3px_rgba(59,130,246,0.45)]",
    labelClassName: "rotate-12",
  },
  {
    label: "GRAVITY_GEN",
    sizePx: 1180,
    durationSec: 134,
    direction: "cw",
    dashed: true,
    align: "end",
    dotClassName: "w-2 h-2 bg-rose-500 shadow-[0_0_12px_2px_rgba(244,63,94,0.45)]",
    labelClassName: "-rotate-180",
  },
  {
    label: "DEEP_ARCHIVE",
    sizePx: 1420,
    durationSec: 162,
    direction: "ccw",
    align: "centerBottom",
    dotClassName: "w-5 h-5 bg-indigo-300 shadow-[0_0_20px_5px_rgba(129,140,248,0.35)]",
  },
];

function orbitContent(orbit: Orbit) {
  const label = (
    <p
      className={[
        "text-[9px] font-mono tracking-tighter text-neutral-500/90 uppercase",
        orbit.labelClassName ?? "",
      ].join(" ")}
    >
      {orbit.label}
    </p>
  );

  const dot = <div className={["rounded-full", orbit.dotClassName].join(" ")} />;

  if (orbit.align === "start") {
    return (
      <div className="flex items-center gap-2 -translate-x-2">
        {dot}
        {label}
      </div>
    );
  }

  if (orbit.align === "end") {
    return (
      <div className="flex items-center gap-2 translate-x-2">
        {label}
        {dot}
      </div>
    );
  }

  if (orbit.align === "centerTop") {
    return (
      <div className="flex flex-col items-center gap-1 -translate-y-2.5">
        {label}
        {dot}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 translate-y-2.5">
      {dot}
      {label}
    </div>
  );
}

export function GalaxyBackdrop() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden"
      aria-hidden
    >
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.18, 0.42, 0.18] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-[220px] h-[220px] rounded-full bg-indigo-600 blur-[60px]"
      />

      <div className="relative z-10 flex items-center justify-center rounded-full p-2">
        <span className="relative h-28 w-28 md:h-32 md:w-32 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.02] shadow-[0_0_35px_rgba(99,102,241,0.18)]">
          <NeuralBackground clipPathId="neural-brain-clip-landing-shell" />
        </span>
      </div>

      {orbits.map((orbit) => {
        const borderStyle = orbit.dashed ? "border-dashed" : "";
        const rotateTo = orbit.direction === "cw" ? 360 : -360;

        return (
          <motion.div
            key={orbit.label}
            animate={{ rotate: rotateTo }}
            transition={{
              duration: orbit.durationSec,
              repeat: Infinity,
              ease: "linear",
            }}
            className={[
              "absolute rounded-full border border-white/5 transition-colors duration-500",
              borderStyle,
            ].join(" ")}
            style={{ width: orbit.sizePx, height: orbit.sizePx }}
          >
            <div
              className={[
                "absolute inset-0 flex",
                orbit.align === "start"
                  ? "items-center justify-start"
                  : orbit.align === "end"
                    ? "items-center justify-end"
                    : orbit.align === "centerTop"
                      ? "items-start justify-center"
                      : "items-end justify-center",
              ].join(" ")}
            >
              {orbitContent(orbit)}
            </div>
          </motion.div>
        );
      })}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_72%)]" />
    </div>
  );
}

