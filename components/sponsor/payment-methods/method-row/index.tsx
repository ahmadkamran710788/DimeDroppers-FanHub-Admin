"use client";

import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import RowActionsMenu, { type RowAction } from "@/components/common/row-actions-menu";
import StatusPill from "@/components/common/status-pill";
import { OUTLINE_BUTTON } from "@/components/sponsor/styles";
import { methodDetail, methodProblem } from "@/components/sponsor/payment-methods/data";
import type { SponsorPaymentMethod } from "@/utils/types/sponsor-payments";

const PILL = "h-5 px-2";
const PILL_TEXT = "text-[11px] font-bold";

interface MethodRowProps {
  method: SponsorPaymentMethod;
  onMakeDefault: () => void;
  onVerify: () => void;
  onRemove: () => void;
}

// One saved payment method: its label and details, Default / Pending verification / Expired, and its
// actions (make it its type's default, verify a bank account, remove).
export default function MethodRow({ method: m, onMakeDefault, onVerify, onRemove }: MethodRowProps) {
  const problem = methodProblem(m);
  const pending = m.status === "PENDING_VERIFICATION";
  const actions: RowAction[] = [
    ...(m.isUsable && !m.isDefault ? [{ label: "Make default", onSelect: onMakeDefault }] : []),
    ...(pending ? [{ label: "Verify", onSelect: onVerify }] : []),
    { label: "Remove", onSelect: onRemove, variant: "destructive" as const },
  ];

  return (
    <li className="rounded-[12px] border border-[#262626] bg-[#0b0b0b] p-3 sm:p-4 flex flex-wrap items-center gap-3">
      <div className="flex-[1_1_200px] min-w-0 flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-semibold break-words">{m.label}</span>
          {m.isDefault && <StatusPill label="Default" color="bg-[#c9b8ff]" className={PILL} textClassName={PILL_TEXT} />}
          {pending && (
            <StatusPill label="Pending verification" color="bg-[#f0c36a]" className={PILL} textClassName={PILL_TEXT} />
          )}
          {m.isExpired && <StatusPill label="Expired" color="bg-error/70" className={PILL} textClassName={PILL_TEXT} />}
          {m.status === "FAILED" && (
            <StatusPill label="Verification failed" color="bg-error/70" className={PILL} textClassName={PILL_TEXT} />
          )}
        </div>
        <span className="text-[13px] text-[#a8a8a8] break-words">
          {[methodDetail(m), m.holderName].filter(Boolean).join(" · ")}
        </span>
        {problem && !pending && <span className={cn("text-[13px] text-[#ff8a8d]")}>{problem}</span>}
      </div>
      {pending && (
        <Button label="Verify" onClick={onVerify} className={cn(OUTLINE_BUTTON, "h-10 px-4 rounded-[10px] text-sm")} />
      )}
      <RowActionsMenu items={actions} ariaLabel={`Actions for ${m.label}`} />
    </li>
  );
}
