"use client";

type SectionHeaderProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
};

export function SectionHeader({ kicker, title, subtitle, align = "center" }: SectionHeaderProps) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <div className={["flex flex-col", alignClass].join(" ")}>
      {kicker ? (
        <div className="font-mono text-[10px] md:text-xs tracking-[0.22em] text-neutral-500 uppercase">
          {kicker}
        </div>
      ) : null}
      <h2 className="mt-2 text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500 sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 max-w-2xl font-mono text-xs md:text-sm text-indigo-300/90 uppercase tracking-widest">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

