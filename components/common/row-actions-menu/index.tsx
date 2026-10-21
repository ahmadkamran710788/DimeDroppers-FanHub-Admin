"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "@/utils/cn";
import FloatingPanel, { MENU_ITEM } from "@/components/common/floating-panel";

export interface RowAction {
  label: string;
  onSelect: () => void;
  variant?: "default" | "destructive";
}

interface RowActionsMenuProps {
  items: readonly RowAction[];
  ariaLabel: string;
  className?: string;
  // Replaces the default kebab icon, e.g. a labelled "3 Campaigns" trigger.
  trigger?: ReactNode;
}

export default function RowActionsMenu({ items, ariaLabel, className, trigger }: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

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
        {trigger ?? <MoreVertical className="w-4 h-4 text-white" strokeWidth={2} />}
      </button>
      {open && (
        <FloatingPanel anchorRef={triggerRef} onClose={close} role="menu" aria-label={ariaLabel} className="min-w-[160px]">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                item.onSelect();
              }}
              className={cn(MENU_ITEM, "hover:bg-white/10", item.variant === "destructive" && "text-red-400")}
            >
              {item.label}
            </button>
          ))}
        </FloatingPanel>
      )}
    </>
  );
}
