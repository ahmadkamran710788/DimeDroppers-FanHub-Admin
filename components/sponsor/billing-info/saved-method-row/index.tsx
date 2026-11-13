"use client";

import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import RowActionsMenu, { type RowAction } from "@/components/common/row-actions-menu";
import { badgeOf, PANEL } from "@/components/sponsor/billing-info/data";
import { methodDetail, methodProblem } from "@/components/sponsor/payment-methods/data";
import type { SponsorPaymentMethod } from "@/utils/types/sponsor-payments";

interface SavedMethodRowProps {
  method: SponsorPaymentMethod;
  // A default change is on its way (the radios wait).
  busy: boolean;
  onMakeDefault: () => void;
  onVerify: () => void;
  onRemove: () => void;
}

const DEFAULT_PILL = "rounded-[10px] px-3 py-2 bg-[#2a2b30] text-sm text-[#f4f4f5] whitespace-nowrap";

// One saved payment method: the radio that makes it its type's default, its badge, label and details, and its
// actions (make default, verify a bank account, remove).
export default function SavedMethodRow({ method: m, busy, onMakeDefault, onVerify, onRemove }: SavedMethodRowProps) {
  const badge = badgeOf(m);
  const problem = methodProblem(m);
  const pending = m.status === "PENDING_VERIFICATION";
  const type = m.typeLabel.toLowerCase();
  const actions: RowAction[] = [
    ...(m.isUsable && !m.isDefault ? [{ label: "Make default", onSelect: onMakeDefault }] : []),
    ...(pending ? [{ label: "Verify", onSelect: onVerify }] : []),
    { label: "Remove", onSelect: onRemove, variant: "destructive" as const },
  ];
  const detail = [methodDetail(m), m.holderName].filter(Boolean).join(" · ");

  return (
    <div className={cn(PANEL, "flex items-center gap-2 sm:gap-4 px-2 py-3 sm:px-[18px] sm:py-4")}>
      <Button
        size="icon"
        variant="text"
        role="radio"
        aria-checked={m.isDefault}
        aria-label={`Use ${m.label} as your default ${type}`}
        disabled={!m.isUsable || busy}
        onClick={() => {
          if (!m.isDefault) onMakeDefault();
        }}
        icon={
          <span
            className={cn(
              "block size-[22px] rounded-full border-2",
              m.isDefault
                ? "border-[#f472b6] bg-[radial-gradient(circle,#f472b6_0_5px,transparent_6px)]"
                : "border-[#52525b]"
            )}
          />
        }
        className="size-11 rounded-[10px] disabled:opacity-40"
      />
      <span
        className={cn(
          "shrink-0 min-w-[52px] h-9 px-2 rounded-[8px] flex items-center justify-center font-extrabold",
          badge.className
        )}
      >
        {badge.text}
      </span>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <span className="text-[17px] font-semibold truncate" title={m.label}>
          {m.label}
        </span>
        {detail && <span className="text-sm text-[#a1a1aa] break-words">{detail}</span>}
        {problem && <span className="text-[13px] text-[#fca5a5]">{problem}</span>}
        {m.isDefault && <span className={cn(DEFAULT_PILL, "sm:hidden self-start px-2.5 py-1 text-xs")}>Default</span>}
      </div>
      {m.isDefault && <span className={cn(DEFAULT_PILL, "hidden sm:inline-flex")}>Default</span>}
      {pending && (
        <Button
          label="Verify"
          onClick={onVerify}
          className="hidden sm:inline-flex h-10 min-w-0 px-3.5 rounded-[10px] border border-[#ca8a04] bg-transparent text-sm font-semibold text-[#fde68a] backdrop-blur-none"
        />
      )}
      <RowActionsMenu
        items={actions}
        ariaLabel={`More options for ${m.label}`}
        className="shrink-0 size-11 rounded-[10px] bg-transparent outline-0 backdrop-blur-none hover:bg-white/10"
      />
    </div>
  );
}
