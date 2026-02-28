/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect } from "react";

interface CommandPaletteProps {
  onOpenSearch: () => void;
}

export default function CommandPalette({ onOpenSearch }: CommandPaletteProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenSearch]);

  return null;
}
