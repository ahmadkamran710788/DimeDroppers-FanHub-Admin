"use client";

import { type ReactNode } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";
import { PANEL, type AddMethodOption } from "@/components/sponsor/billing-info/data";

interface AddMethodRowProps {
  option: AddMethodOption;
  open: boolean;
  onToggle: () => void;
  // Why this type can't be added (e.g. the limit is reached); shown in place of the description.
  blockedReason?: string;
  // The form, rendered while open.
  children?: ReactNode;
}

// One way to pay under "Add a payment method": its icon, name and description; opening it shows its form.
export default function AddMethodRow({ option, open, onToggle, blockedReason, children }: AddMethodRowProps) {
  const { Icon } = option;
  const formId = `add-method-${option.type.toLowerCase()}`;
  return (
    <div className={cn(PANEL, "overflow-hidden flex flex-col")}>
      {/* A whole clickable row that opens the form below, not an action button. */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? formId : undefined}
        disabled={!!blockedReason}
        onClick={onToggle}
        className="flex w-full min-h-[88px] items-center gap-3 sm:gap-[18px] px-4 py-4 sm:px-[22px] sm:py-[18px] text-left text-[#f4f4f5] transition-colors hover:bg-white/[0.02] disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <span
          className={cn(
            "shrink-0 size-[52px] rounded-[12px] flex items-center justify-center",
            option.tileClassName,
            blockedReason && "opacity-60"
          )}
        >
          <Icon className="size-6" strokeWidth={1.7} aria-hidden />
        </span>
        <span className="flex-1 min-w-0 flex flex-col gap-1">
          <span className="text-lg font-medium">{option.name}</span>
          <span className="text-[15px] leading-[1.4] text-[#a1a1aa]">{blockedReason ?? option.description}</span>
        </span>
        {!blockedReason &&
          (open ? (
            <ChevronDown className="shrink-0 size-[22px] text-[#a1a1aa]" strokeWidth={1.8} aria-hidden />
          ) : (
            <ArrowRight className="shrink-0 size-[22px] text-[#a1a1aa]" strokeWidth={1.8} aria-hidden />
          ))}
      </button>
      {open && (
        <div id={formId} className="border-t border-[#1e2026] px-4 py-5 sm:px-[22px]">
          {children}
        </div>
      )}
    </div>
  );
}
