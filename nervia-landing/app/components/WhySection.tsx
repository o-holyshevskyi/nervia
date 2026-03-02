"use client";

import { FadeIn } from "./FadeIn";
import { FolderTree, Network } from "lucide-react";

export function WhySection() {
  return (
    <section className="relative px-6 py-24 md:py-32" id="why">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Folders are for files. Your brain works in connections.
          </h2>
        </FadeIn>
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
              <div className="flex items-center gap-3 text-slate-400">
                <FolderTree className="h-8 w-8" />
                <span className="text-sm font-medium uppercase tracking-wider">
                  The old way
                </span>
              </div>
              <p className="mt-4 text-lg text-slate-300">
                Static hierarchies. Notes buried in folders. No way to see how
                ideas link across projects. Your second brain stays flat - and
                forgettable.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-8 backdrop-blur-xl">
              <div className="flex items-center gap-3 text-cyan-400">
                <Network className="h-8 w-8" />
                <span className="text-sm font-medium uppercase tracking-wider">
                  The Nervia way
                </span>
              </div>
              <p className="mt-4 text-lg text-slate-300">
                A living, breathing 3D neural network. Neurons, sources, and
                impulses connected visually. Fly through your knowledge and watch
                AI surface hidden connections in real time.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
