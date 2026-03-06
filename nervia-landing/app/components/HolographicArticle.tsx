import type { ReactNode } from "react";

type HolographicArticleProps = {
  /** Small HUD label shown above title. */
  kicker?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function HolographicArticle({ kicker, title, subtitle, children, footer }: HolographicArticleProps) {
  return (
    <article className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-8 backdrop-blur-sm shadow-[0_0_60px_rgba(99,102,241,0.10)] md:p-12">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-24 left-1/2 h-56 w-[600px] -translate-x-1/2 bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-purple-500/0 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.10),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.08),transparent_46%)]" />
      </div>

      <div className="relative">
        {kicker ? (
          <div className="mb-2 font-mono text-[10px] tracking-[0.22em] text-neutral-400/90 uppercase">
            {kicker}
          </div>
        ) : null}

        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400">
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-2 font-mono text-xs text-indigo-300/90 uppercase tracking-widest">
            {subtitle}
          </p>
        ) : null}

        <div className="mt-10 prose prose-invert max-w-none space-y-8 text-neutral-300 prose-headings:text-white prose-a:text-indigo-300 hover:prose-a:text-indigo-200 prose-strong:text-neutral-200">
          {children}
        </div>

        {footer ? (
          <div className="mt-12 border-t border-white/10 pt-8">{footer}</div>
        ) : null}
      </div>
    </article>
  );
}

