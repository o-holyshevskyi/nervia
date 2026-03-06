"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "reason", label: "Why" },
  { id: "features", label: "Features" },
  { id: "pricing", label: "Pricing" },
  { id: "why-build", label: "Origin" },
  { id: "faq", label: "FAQ" },
  { id: "footer", label: "Footer" },
] as const;

export function SectionNav() {
  const [activeId, setActiveId] = useState<string | null>("hero");

  useEffect(() => {
    const sections = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      {
        root: null,
        rootMargin: "-40% 0px -40% 0px",
        threshold: 0,
      }
    );

    sections.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className="fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 lg:flex"
      aria-label="Page sections"
    >
      <div className="flex flex-col gap-2">
        {SECTIONS.map((section) => {
          const isActive = activeId === section.id;
          return (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="group relative block cursor-pointer"
              aria-current={isActive ? "true" : undefined}
              data-active={isActive ? "true" : "false"}
            >
              <div
                className={[
                  "relative h-16 rounded-full",
                  "w-[6px] group-hover:w-[8px] data-[active=true]:w-[10px]",
                  "bg-black/15 dark:bg-white/25",
                  "transition-[width,background-color,box-shadow] duration-300 ease-out",
                  "group-hover:bg-black/25 dark:group-hover:bg-white/35",
                  "data-[active=true]:bg-[rgba(168,85,247,0.18)] data-[active=true]:shadow-[0_0_18px_rgba(168,85,247,0.22)]",
                ].join(" ")}
              >
                <motion.div
                  className="absolute inset-0 rounded-full bg-[rgba(168,85,247,0.92)]"
                  initial={false}
                  animate={{ opacity: isActive ? 1 : 0, scaleY: isActive ? 1 : 0.5 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{ originY: 0.5 }}
                />
              </div>

              <span
                className={[
                  "pointer-events-none absolute left-full top-1/2 -translate-y-1/2 whitespace-nowrap",
                  "ml-4 font-mono text-xs uppercase tracking-widest text-neutral-400",
                  "opacity-0 -translate-x-2",
                  "transition-all duration-300 ease-out",
                  "group-hover:opacity-100 group-hover:translate-x-0",
                ].join(" ")}
              >
                {section.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
