"use client";

import { useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";

/**
 * Dropdown panel anchored to a trigger: the row actions menu, filter chip menus and the Select
 * option list all open in it, so they share one look (navy panel, white items).
 *
 * Triggers often live inside `overflow-x-auto` wrappers, which compute `overflow-y: auto` — an
 * absolutely-positioned panel is clipped by them and makes the wrapper sprout a scrollbar.
 * Portalling to <body> escapes every overflow ancestor, so the panel floats over the page instead.
 */

/**
 * Portalled to <body>, so this only competes with other root-level siblings.
 * `main` in the dashboard layout is `relative z-10`, which traps the app's
 * `z-50` modals inside its own stacking context — any positive value here
 * paints above them. Kept below Header's 9999 so the account menu wins.
 */
const PANEL_Z_INDEX = 9990;

/** Gap between trigger and panel. Mirrors the old `mt-1`. */
const PANEL_OFFSET = 4;

/** Minimum breathing room from the viewport edge when clamping. */
const VIEWPORT_PADDING = 8;

// `useLayoutEffect` warns during prerender: the hook is still called on the
// server even though the panel only mounts once opened.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// One row in the panel (a menu item or a select option).
export const MENU_ITEM = "w-full px-4 py-2.5 text-left text-sm text-white whitespace-nowrap transition-colors";

interface FloatingPanelProps extends HTMLAttributes<HTMLDivElement> {
  anchorRef: RefObject<HTMLElement | null>;
  // Called on an outside click, Escape, or a scroll/resize that would leave the panel behind.
  // Pass a stable function (useCallback): the listeners re-subscribe when it changes.
  onClose: () => void;
  // "end": right edges line up (menus). "start": left edges line up and the panel is at least
  // as wide as the anchor (select lists).
  align?: "start" | "end";
  children: ReactNode;
}

// Render it only while open; it positions itself under the anchor on mount.
export default function FloatingPanel({
  anchorRef,
  onClose,
  align = "end",
  className,
  style,
  children,
  ...rest
}: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; minWidth?: number } | null>(null);

  // Position before paint so the panel never flashes at 0,0. The panel is
  // mounted at `visibility: hidden` — which preserves layout, unlike
  // `display: none` — so offsetWidth/Height are real measurements and the
  // height never has to be guessed from the item count.
  useIsomorphicLayoutEffect(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;

    const t = anchor.getBoundingClientRect();
    // Set the select list's width before measuring, so the clamps below use the real size.
    const minWidth = align === "start" ? t.width : undefined;
    if (minWidth !== undefined) panel.style.minWidth = `${minWidth}px`;
    const panelW = panel.offsetWidth;
    const panelH = panel.offsetHeight;
    // clientWidth/Height exclude the scrollbar gutter; innerWidth does not.
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    // Prefer below; flip above only when that genuinely has more room.
    const spaceBelow = vh - t.bottom;
    const flipUp = spaceBelow < panelH + PANEL_OFFSET + VIEWPORT_PADDING && t.top > spaceBelow;
    let top = flipUp ? t.top - panelH - PANEL_OFFSET : t.bottom + PANEL_OFFSET;
    // Clamp last, so a panel taller than the viewport still starts on screen.
    top = Math.max(VIEWPORT_PADDING, Math.min(top, vh - panelH - VIEWPORT_PADDING));

    let left = align === "start" ? t.left : t.right - panelW;
    left = Math.max(VIEWPORT_PADDING, Math.min(left, vw - panelW - VIEWPORT_PADDING));

    setCoords({ top, left, minWidth });
  }, [anchorRef, align]);

  // Close on scroll/resize rather than tracking the anchor: the panel is
  // fixed-positioned, so it would otherwise hang in place while the anchor
  // scrolls away beneath it. Capture phase is required — scroll events from
  // `main.overflow-y-auto` and table wrappers do not bubble to window. A long
  // list scrolling inside the panel itself keeps it open.
  useEffect(() => {
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("resize", onClose, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  // Outside click + Escape. The panel is portalled, so it is not a DOM
  // descendant of the anchor — both refs have to be checked.
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      onClose();
      anchorRef.current?.focus();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [anchorRef, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      {...rest}
      // `flex flex-col` blockifies the items. Without it they stay
      // `display: inline-block` (preflight never sets a display on
      // `button`), and a shrink-to-fit fixed box sizes to the SUM of its
      // inline children rather than the widest one.
      className={cn("fixed flex flex-col bg-[#0B1C2D] border border-white/10 rounded-lg shadow-xl overflow-hidden", className)}
      style={{
        ...style,
        top: coords?.top ?? 0,
        left: coords?.left ?? 0,
        minWidth: coords?.minWidth,
        zIndex: PANEL_Z_INDEX,
        visibility: coords ? "visible" : "hidden",
      }}
    >
      {children}
    </div>,
    document.body
  );
}
