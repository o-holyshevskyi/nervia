"use client";

import { FadeIn } from "./FadeIn";
import { FolderTree, Network } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { HolographicCard } from "./HolographicCard";

export function WhySection() {
  return (
    <div className="relative w-full">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="text-center">
          <SectionHeader
            kicker="Sys.Req // rationale"
            title="Folders are for files. Your brain works in connections."
            subtitle="Switch from hierarchies to a living graph."
          />
        </FadeIn>
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          <FadeIn delay={0.1}>
            <HolographicCard>
              <div className="flex items-center gap-3 text-neutral-400">
                <FolderTree className="h-8 w-8" />
                <span className="text-sm font-medium uppercase tracking-wider">
                  The old way
                </span>
              </div>
              <p className="mt-4 text-lg text-neutral-300">
                Static hierarchies. Notes buried in folders. No way to see how
                ideas link across projects. Your second brain stays flat - and
                forgettable.
              </p>
            </HolographicCard>
          </FadeIn>
          <FadeIn delay={0.2}>
            <HolographicCard variant="highlighted">
              <div className="flex items-center gap-3 text-indigo-300">
                <Network className="h-8 w-8" />
                <span className="text-sm font-medium uppercase tracking-wider">
                  The Nervia way
                </span>
              </div>
              <p className="mt-4 text-lg text-neutral-300">
                A living, breathing 3D neural network. Neurons, sources, and
                impulses connected visually. Fly through your knowledge and watch
                AI surface hidden connections in real time.
              </p>
            </HolographicCard>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
