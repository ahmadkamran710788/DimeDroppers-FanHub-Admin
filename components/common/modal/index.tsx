"use client";

import { cn } from "@/utils/cn";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Portalled to <body>: a blurred or transformed ancestor would otherwise become the
  // containing block for `fixed`, pinning the popup to that panel instead of the viewport.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.55)] backdrop-blur-sm"
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
