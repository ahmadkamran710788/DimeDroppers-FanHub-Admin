"use client";

import { cn } from "@/utils/cn";
import { useEffect, useEffectEvent } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  // Callers pass a new onClose on every render (often every keystroke); read through an effect event,
  // it doesn't re-attach the listener and re-lock the page each time. A closed modal leaves the page's
  // scroll lock alone, so it can't unlock the page under another modal that is open.
  const close = useEffectEvent(() => onClose());
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Portalled to <body>: a blurred or transformed ancestor would otherwise become the
  // containing block for `fixed`, pinning the popup to that panel instead of the viewport.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Tint only: a full-screen backdrop blur over the page's own blurs made every repaint under an open modal slow. */}
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.55)]"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-[min(402px,calc(100vw-2rem))] rounded-[24px] p-6",
          "flex flex-col items-center gap-6 bg-white",
          className
        )}
      >
        {title && (
          <h2 className="w-full font-display font-black text-[28px] uppercase text-midnight-navy leading-tight">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}
