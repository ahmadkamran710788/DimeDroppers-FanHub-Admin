"use client";

import { cn } from "@/utils/cn";
import { useEffect } from "react";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.8)] backdrop-blur-[104px]"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-[402px] max-w-[calc(100vw-2rem)] rounded-[24px] p-6",
          "flex flex-col items-center gap-6 bg-[rgba(255,255,255,0.8)] backdrop-blur-[104px]",
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
    </div>
  );
}
