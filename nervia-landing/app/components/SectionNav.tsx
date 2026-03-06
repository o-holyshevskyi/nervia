"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const SECTIONS = [
  { id: "hero" },
  { id: "reason" },
  { id: "features" },
  { id: "pricing" },
  { id: "why-build" },
  { id: "faq" },
  { id: "footer" },
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
              className="group block"
              aria-current={isActive ? "true" : undefined}
            >
              <motion.div
                className="h-16 w-0.75 rounded-full"
                initial={false}
                animate={{
                  backgroundColor: isActive
                    ? "rgba(99, 102, 241, 0.9)"
                    : "rgba(255, 255, 255, 0.25)",
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
