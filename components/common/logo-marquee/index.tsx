"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface LogoMarqueeProps {
  // One node per logo (keyed by the caller's ids).
  items: { key: string; node: ReactNode }[];
  className?: string;
  // Space between logos, in px.
  gap?: number;
}

// A row of logos, as wide as its logos up to the space it has (so a flex parent can centre it). When they
// all fit they sit side by side; when they don't, the row slides sideways on a loop (paused on hover; a
// plain scroll for people who turn motion off).
export default function LogoMarquee({ items, className, gap = 32 }: LogoMarqueeProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);

  // Measures one copy of the row against the frame, again whenever either is resized (logos loading too).
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const row = rowRef.current;
    if (!frame || !row) return;
    const measure = () => setOverflows(row.scrollWidth > frame.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(row);
    return () => observer.disconnect();
  }, [items.length]);

  const row = (copy: number) => (
    <div
      ref={copy === 0 ? rowRef : undefined}
      aria-hidden={copy > 0 || undefined}
      className="flex shrink-0 items-center"
      style={{ gap, paddingRight: overflows ? gap : 0 }}
    >
      {items.map((i) => (
        <span key={i.key} className="shrink-0">
          {i.node}
        </span>
      ))}
    </div>
  );

  return (
    <div
      ref={frameRef}
      className={cn(
        "group min-w-0 overflow-hidden motion-reduce:overflow-x-auto",
        overflows && "mask-[linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]",
        className
      )}
    >
      <div
        className={cn(
          "flex w-max",
          overflows
            ? "animate-[logo-marquee_var(--marquee-duration)_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none"
            : undefined
        )}
        // About 4s per logo, so a long row doesn't race.
        style={{ ["--marquee-duration" as string]: `${Math.max(items.length * 4, 12)}s` }}
      >
        {row(0)}
        {/* A second copy follows the first, so the loop has no gap. */}
        {overflows && row(1)}
      </div>
    </div>
  );
}
