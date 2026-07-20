"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * Table rows live inside `overflow-x-auto` wrappers, which compute
 * `overflow-y: auto` — an absolutely-positioned menu is clipped by them and
 * makes the wrapper sprout a scrollbar. Portalling to <body> escapes every
 * overflow ancestor, so the menu floats over the page instead.
 */

/**
 * Portalled to <body>, so this only competes with other root-level siblings.
 * `main` in the dashboard layout is `relative z-10`, which traps the app's
 * `z-50` modals inside its own stacking context — any positive value here
 * paints above them. Kept below Header's 9999 so the account menu wins.
 */
const MENU_Z_INDEX = 9990;

/** Gap between trigger and panel. Mirrors the old `mt-1`. */
const MENU_OFFSET = 4;

/** Minimum breathing room from the viewport edge when clamping. */
const VIEWPORT_PADDING = 8;

// `useLayoutEffect` warns during prerender: the hook is still called on the
// server even though its body early-returns while closed.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface RowAction {
  label: string;
  onSelect: () => void;
  variant?: "default" | "destructive";
}

interface RowActionsMenuProps {
  items: readonly RowAction[];
  ariaLabel: string;
  className?: string;
}

export default function RowActionsMenu({ items, ariaLabel, className }: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setCoords(null);
  }, []);

  // Position before paint so the panel never flashes at 0,0. The panel is
  // mounted at `visibility: hidden` — which preserves layout, unlike
  // `display: none` — so offsetWidth/Height are real measurements and the
  // height never has to be guessed from the item count.
  useIsomorphicLayoutEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const t = trigger.getBoundingClientRect();
    const panelW = panel.offsetWidth;
    const panelH = panel.offsetHeight;
    // clientWidth/Height exclude the scrollbar gutter; innerWidth does not.
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    // Prefer below; flip above only when that genuinely has more room.
    const spaceBelow = vh - t.bottom;
    const flipUp = spaceBelow < panelH + MENU_OFFSET + VIEWPORT_PADDING && t.top > spaceBelow;
    let top = flipUp ? t.top - panelH - MENU_OFFSET : t.bottom + MENU_OFFSET;
    // Clamp last, so a panel taller than the viewport still starts on screen.
    top = Math.max(VIEWPORT_PADDING, Math.min(top, vh - panelH - VIEWPORT_PADDING));

    // Right-align to the trigger (the old `right-0`), then clamp.
    let left = t.right - panelW;
    left = Math.max(VIEWPORT_PADDING, Math.min(left, vw - panelW - VIEWPORT_PADDING));

    setCoords({ top, left });
  }, [open, items.length]);

  // Close on scroll/resize rather than tracking the trigger: the panel is
  // fixed-positioned, so it would otherwise hang in place while the row
  // scrolls away beneath it. Capture phase is required — scroll events from
  // `main.overflow-y-auto` and the table wrapper do not bubble to window.
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", close, { capture: true, passive: true });
    window.addEventListener("resize", close, { passive: true });
    return () => {
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
    };
  }, [open, close]);

  // Outside click + Escape. The panel is portalled, so it is not a DOM
  // descendant of the trigger — both refs have to be checked.
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      close();
      triggerRef.current?.focus();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            role="menu"
            aria-label={ariaLabel}
            className="fixed min-w-[160px] bg-[#0B1C2D] border border-white/10 rounded-lg shadow-xl overflow-hidden"
            style={{
              top: coords?.top ?? 0,
              left: coords?.left ?? 0,
              zIndex: MENU_Z_INDEX,
              visibility: coords ? "visible" : "hidden",
            }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  item.onSelect();
                }}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors whitespace-nowrap",
                  item.variant === "destructive" ? "text-red-400" : "text-white"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : setOpen(true))}
        className={cn(
          "size-10 px-2 bg-white/10 rounded-lg outline outline-1 outline-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20 transition-colors",
          className
        )}
      >
        <MoreVertical className="w-4 h-4 text-white" strokeWidth={2} />
      </button>
      {panel}
    </>
  );
}
