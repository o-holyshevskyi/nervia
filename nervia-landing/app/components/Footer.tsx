"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ChevronUp, Mail } from "lucide-react";
import { APP_URL } from "../lib/app-url";
import { HolographicCard } from "./HolographicCard";
import { NeuralBackground } from "./NeuralBackground";

const jumpLinks = [
  { id: "hero", label: "Top" },
  { id: "features", label: "Features" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
] as const;

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Support", href: "/support" },
] as const;

const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
] as const;

export function Footer() {
  const router = useRouter();

  const jumpTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    router.push(`/#${id}`);
  };

  return (
    <footer className="relative w-full px-6 pb-10">
      <div className="mx-auto w-full max-w-6xl">
        <HolographicCard className="p-8 md:p-12">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-xl">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-neutral-900 dark:text-white"
                >
                  <span
                    className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/[0.03]"
                    aria-hidden
                  >
                    <NeuralBackground clipPathId="neural-brain-clip-footer" />
                  </span>
                  Nervia
                </Link>

                <p className="mt-3 font-mono text-[10px] md:text-xs uppercase tracking-[0.22em] text-neutral-500">
                  Sys.End // transmission complete
                </p>
                <p className="mt-4 text-base md:text-lg text-neutral-700 dark:text-neutral-300">
                  Your universe is a graph. Capture neurons, connect ideas, and navigate knowledge
                  spatially.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`${APP_URL}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={[
                    "inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition",
                    "border-accent bg-accent-soft text-neutral-900 dark:text-white shadow-accent",
                    "hover:bg-[rgba(var(--accent-rgb),0.16)] hover:border-[rgba(var(--accent-rgb),0.42)]",
                    "focus:outline-none focus:ring-2 ring-accent focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black",
                  ].join(" ")}
                >
                  Enter Universe
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/support"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-neutral-900 dark:text-white backdrop-blur-sm transition hover:bg-white/55 dark:hover:bg-white/[0.06] focus:outline-none focus:ring-2 ring-accent focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
                >
                  Support
                  <Mail className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-12">
              <div className="md:col-span-5">
                <h4 className="text-xs font-medium uppercase tracking-widest text-neutral-500">
                  Jump
                </h4>
                <div className="mt-4 flex flex-wrap gap-2">
                  {jumpLinks.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => jumpTo(l.id)}
                      className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] px-4 py-2 text-xs font-medium uppercase tracking-widest text-neutral-700 dark:text-neutral-300 backdrop-blur-sm transition hover:border-[rgba(var(--accent-rgb),0.25)] hover:text-neutral-900 dark:hover:text-white focus:outline-none focus:ring-2 ring-accent focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
                    >
                      {l.label}
                      {l.id === "hero" ? <ChevronUp className="h-3.5 w-3.5" /> : null}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-4">
                <h4 className="text-xs font-medium uppercase tracking-widest text-neutral-500">
                  Company
                </h4>
                <ul className="mt-4 space-y-2">
                  {companyLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-neutral-600 dark:text-neutral-400 transition hover:text-neutral-900 dark:hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-3">
                <h4 className="text-xs font-medium uppercase tracking-widest text-neutral-500">
                  Legal
                </h4>
                <ul className="mt-4 space-y-2">
                  {legalLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-neutral-600 dark:text-neutral-400 transition hover:text-neutral-900 dark:hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-black/10 dark:border-white/10 pt-6 text-sm text-neutral-500 md:flex-row md:items-center md:justify-between">
              <span>© 2026 Nervia</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
                Built for connections
              </span>
            </div>
          </div>
        </HolographicCard>
      </div>
    </footer>
  );
}
