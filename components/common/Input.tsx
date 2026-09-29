"use client";

import { cn } from "@/utils/cn";
import { Eye, EyeOff } from "lucide-react";
import { useState, type ReactNode } from "react";

interface InputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  icon?: ReactNode;
  error?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  // "light" (default): light-grey field. "dark": translucent field with white text on dark cards.
  variant?: "light" | "dark";
  // Muted helper line under the field (hidden while an error is shown).
  hint?: string;
}

export default function Input({
  label,
  name,
  value,
  onChange,
  placeholder,
  icon,
  error,
  type = "text",
  disabled = false,
  className,
  labelClassName,
  variant = "light",
  hint,
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const dark = variant === "dark";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className={cn("text-base font-medium text-midnight-navy", labelClassName)}>
        {label}
      </label>
      <div className="relative flex items-center">
        {icon && (
          <span
            className={cn(
              "absolute w-6 h-6 flex items-center justify-center pointer-events-none z-10",
              dark ? "left-4 text-white/80" : "left-3 text-midnight-navy"
            )}
          >
            {icon}
          </span>
        )}
        <input
          id={name}
          name={name}
          type={isPassword && showPassword ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full h-12 rounded-[8px] text-base font-medium px-4 py-3 border outline-none",
            "focus:border-steel-blue transition-colors disabled:opacity-50",
            dark
              ? "h-[52px] bg-black/30 text-white border-white/25 placeholder:text-white/50"
              : "bg-[#F5F6F8] text-midnight-navy border-[rgba(11,28,45,0.12)] placeholder:text-[rgba(11,28,45,0.4)]",
            icon && (dark ? "pl-16" : "pl-10"),
            isPassword && "pr-11",
            error && "border-error focus:border-error"
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={disabled}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-3 w-6 h-6 flex items-center justify-center text-midnight-navy/60 hover:text-midnight-navy transition-colors disabled:opacity-50"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
      {error ? (
        <p className="text-sm text-error">{error}</p>
      ) : (
        hint && <p className={cn("text-sm", dark ? "text-white/70" : "text-midnight-navy/60")}>{hint}</p>
      )}
    </div>
  );
}
