"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { APP_URL } from "../lib/app-url";
import { NeuralBackground } from "./NeuralBackground";

const SCROLL_THRESHOLD = 10;
const TOP_THRESHOLD = 20;
const HIDE_DELAY_MS = 200;
const SHOW_DELAY_MS = 120;

export function Header() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimeouts = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const prev = lastScrollY.current;
      lastScrollY.current = y;

      if (y <= TOP_THRESHOLD) {
        clearTimeouts();
        setVisible(true);
        return;
      }

      if (y > prev && y - prev > SCROLL_THRESHOLD) {
        if (showTimeoutRef.current) {
          clearTimeout(showTimeoutRef.current);
          showTimeoutRef.current = null;
        }
        if (!hideTimeoutRef.current) {
          hideTimeoutRef.current = setTimeout(() => {
            setVisible(false);
            hideTimeoutRef.current = null;
          }, HIDE_DELAY_MS);
        }
      } else if (y < prev && prev - y > SCROLL_THRESHOLD) {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
        if (!showTimeoutRef.current) {
          showTimeoutRef.current = setTimeout(() => {
            setVisible(true);
            showTimeoutRef.current = null;
          }, SHOW_DELAY_MS);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeouts();
    };
  }, []);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/35 backdrop-blur-2xl transition-[transform] duration-350 ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ transform: visible ? "translateY(0)" : "translateY(-100%)" }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white"
        >
          <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg" aria-hidden>
            <NeuralBackground clipPathId="neural-brain-clip-header" />
          </span>
          Nervia
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          <Link
            href="#features"
            className="text-sm text-neutral-300 transition-colors hover:text-white"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-sm text-neutral-300 transition-colors hover:text-white"
          >
            Pricing
          </Link>
          <Link
            href="#faq"
            className="text-sm text-neutral-300 transition-colors hover:text-white"
          >
            FAQ
          </Link>
        </nav>
        <Link
          href={`${APP_URL}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-indigo-400/35 bg-indigo-500/10 px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_24px_rgba(99,102,241,0.18)] transition hover:border-purple-400/35 hover:bg-purple-500/10 hover:shadow-[0_0_28px_rgba(168,85,247,0.16)] focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-2 focus:ring-offset-black"
        >
          Enter Universe
        </Link>
      </div>
    </header>
  );
}
