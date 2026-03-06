import type { ReactNode } from "react";

type HolographicCardProps = {
  children: ReactNode;
  className?: string;
  /** Use for highlighted/primary cards (e.g. "The Nervia way") */
  variant?: "default" | "highlighted";
};

export function HolographicCard({
  children,
  className = "",
  variant = "default",
}: HolographicCardProps) {
  const baseClass =
    "relative overflow-hidden rounded-2xl border p-6 md:p-8 shadow-[0_0_60px_rgba(99,102,241,0.10)]";
  const variantClass =
    variant === "highlighted"
      ? "border-indigo-500/25 bg-indigo-500/10 shadow-[0_0_40px_rgba(99,102,241,0.10)]"
      : "border-white/10 bg-black/30 backdrop-blur-sm";

  return (
    <div className={`${baseClass} ${variantClass} ${className}`} style={{ transform: "translateZ(0)" }}>
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-24 left-1/2 h-56 w-[600px] -translate-x-1/2 bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-purple-500/0 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.10),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.08),transparent_46%)]" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
