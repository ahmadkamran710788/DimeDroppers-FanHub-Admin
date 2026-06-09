"use client";

import { cn } from "@/utils/cn";
import { type ReactNode } from "react";

type ButtonVariant = "cta" | "primary" | "ghost" | "danger";

interface ButtonProps {
  variant?: ButtonVariant;
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
  className?: string;
}

export default function Button({
  variant = "ghost",
  label,
  onClick,
  icon,
  disabled = false,
  type = "button",
  fullWidth = false,
  className,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={variant === "cta" ? { background: "var(--gradient-cta)" } : undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[8px] h-12 px-6 text-base font-medium text-white transition-opacity",
        "backdrop-blur-[48px] disabled:opacity-50 disabled:cursor-not-allowed",
        variant !== "cta" && "w-[177px]",
        fullWidth && "w-full",
        variant === "primary" && "bg-steel-blue",
        variant === "ghost" && "bg-[rgba(235,235,235,0.25)]",
        variant === "danger" && "bg-error",
        className
      )}
    >
      {icon && <span className="w-5 h-5 flex items-center justify-center">{icon}</span>}
      {label}
    </button>
  );
}
