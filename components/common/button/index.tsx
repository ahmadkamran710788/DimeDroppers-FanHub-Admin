"use client";

import { cn } from "@/utils/cn";
import { type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";

// "text" is a bare label (and icon) with no background, for small inline actions.
type ButtonVariant = "cta" | "primary" | "ghost" | "secondary" | "danger" | "outline" | "text";

// "md" is the standard 48px button; "sm" a compact pill for toolbars and panels; "icon" a round
// icon-only button (40px; className can resize it).
type ButtonSize = "md" | "sm" | "icon";

// A button shows a label; an icon-only one must still be named for screen readers.
type ButtonContent = { label: string } | { label?: undefined; icon: ReactNode; "aria-label": string };

// Native attributes (aria-*, title, …) pass through to the <button>.
type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className" | "disabled" | "onClick" | "type"> &
  ButtonContent & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    onClick?: () => void;
    icon?: ReactNode;
    // Which side of the label the icon renders on.
    iconPosition?: "start" | "end";
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    fullWidth?: boolean;
    className?: string;
    // Extra content after the label, e.g. an unread badge.
    children?: ReactNode;
    // E.g. to anchor a popover under the button.
    ref?: Ref<HTMLButtonElement>;
  };

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: "inline-flex items-center justify-center gap-2 rounded-[8px] h-12 px-6 text-base font-medium transition-opacity",
  sm: "inline-flex items-center justify-center gap-2 rounded-full h-8 px-3 text-xs font-medium transition-colors",
  icon: "inline-flex items-center justify-center shrink-0 rounded-full size-10 transition-colors",
};

export default function Button({
  variant = "ghost",
  size = "md",
  label,
  onClick,
  icon,
  iconPosition = "start",
  disabled = false,
  type = "button",
  fullWidth = false,
  className,
  children,
  ref,
  ...rest
}: ButtonProps) {
  // Icon-only buttons let the icon keep its own size.
  const iconWrapper = size === "icon" ? "flex items-center justify-center" : "w-5 h-5 flex items-center justify-center";
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={variant === "cta" ? { background: "var(--gradient-cta)" } : undefined}
      className={cn(
        SIZE_CLASSES[size],
        "backdrop-blur-[48px] disabled:opacity-50 disabled:cursor-not-allowed",
        variant !== "cta" && size !== "icon" && (size === "md" ? "w-auto min-w-[120px]" : "w-auto"),
        fullWidth && "w-full",
        variant === "primary" && "bg-steel-blue text-white",
        variant === "ghost" && "bg-[rgba(235,235,235,0.25)] text-white",
        variant === "secondary" && "bg-white text-midnight-navy border border-midnight-navy/20 hover:bg-gray-50",
        variant === "danger" && "bg-error text-white",
        variant === "outline" && "bg-transparent text-white border border-[#638BFE]/80 hover:bg-white/5",
        variant === "text" && "h-auto px-0 bg-transparent backdrop-blur-none text-white/70 hover:text-white",
        className
      )}
    >
      {icon && iconPosition === "start" && <span className={iconWrapper}>{icon}</span>}
      {label}
      {icon && iconPosition === "end" && <span className={iconWrapper}>{icon}</span>}
      {children}
    </button>
  );
}
