"use client";

type SnapSectionProps = {
  id?: string;
  children: React.ReactNode;
  /** If true, section content can scroll inside the viewport (e.g. Features, FAQ). */
  scrollable?: boolean;
  /** If true, content is aligned to the bottom of the section (e.g. Footer). */
  alignBottom?: boolean;
  className?: string;
};

export function SnapSection({
  id,
  children,
  scrollable = false,
  alignBottom = false,
  className = "",
}: SnapSectionProps) {
  const contentClass = scrollable
    ? "flex flex-col w-full min-h-min flex-shrink-0 max-w-6xl mx-auto overflow-visible"
    : "flex flex-col w-full min-h-0 max-w-6xl mx-auto overflow-visible";
  const content = (
    <div className={`relative ${contentClass}`}>
      {children}
    </div>
  );

  const justifyClass = alignBottom ? "justify-end" : "justify-center";

  return (
    <section
      id={id}
      className={[
        "relative z-10 h-screen min-h-screen w-full snap-center snap-always flex flex-col items-center px-6 box-border",
        justifyClass,
        scrollable ? "min-h-0 overflow-hidden" : "",
        className,
      ].join(" ")}
    >
      {scrollable ? (
        <div
          className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide flex flex-col items-center py-8 md:py-12"
          data-scrollbar-hide
        >
          {content}
        </div>
      ) : (
        <div
          className={`w-full min-h-0 flex flex-col items-center ${justifyClass} ${alignBottom ? "flex-shrink-0" : "h-full"}`}
        >
          {content}
        </div>
      )}
    </section>
  );
}
