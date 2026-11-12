"use client";

import { CreditCard, Landmark, Link2, Smartphone, type LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import { CARD, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import MethodRow from "@/components/sponsor/payment-methods/method-row";
import { TYPE_HINTS } from "@/components/sponsor/payment-methods/data";
import type { PaymentMethodType, SponsorPaymentMethod } from "@/utils/types/sponsor-payments";

const ICONS: Record<PaymentMethodType, LucideIcon> = {
  CARD: CreditCard,
  US_BANK_ACCOUNT: Landmark,
  CASHAPP: Smartphone,
  LINK: Link2,
};

interface MethodGroupProps {
  type: PaymentMethodType;
  label: string;
  methods: SponsorPaymentMethod[];
  // How many of this type may be saved; unknown until the options load.
  maxSaved?: number;
  // Add is offered (payments can be taken here, and the limit isn't reached).
  canAdd: boolean;
  onAdd: () => void;
  onMakeDefault: (method: SponsorPaymentMethod) => void;
  onVerify: (method: SponsorPaymentMethod) => void;
  onRemove: (method: SponsorPaymentMethod) => void;
}

// The saved methods of one type (Card, US bank account, Cash App Pay, Link), with Add until the limit.
export default function MethodGroup({
  type,
  label,
  methods,
  maxSaved,
  canAdd,
  onAdd,
  onMakeDefault,
  onVerify,
  onRemove,
}: MethodGroupProps) {
  const Icon = ICONS[type];
  return (
    <section aria-label={label} className={cn(CARD, "rounded-[14px] p-4 sm:p-[22px] flex flex-col gap-4")}>
      <div className="flex flex-wrap items-start gap-3">
        <span className="size-10 shrink-0 rounded-[10px] bg-[#1d1830] border border-[#2e2650] flex items-center justify-center">
          <Icon className="size-5 text-[#c9b8ff]" strokeWidth={1.75} />
        </span>
        <div className="flex-[1_1_180px] min-w-0">
          <h3 className="text-[17px] font-bold">
            {label}
            {maxSaved !== undefined && (
              <span className="ml-2 text-[13px] font-medium text-[#a8a8a8]">{`${methods.length} of ${maxSaved}`}</span>
            )}
          </h3>
          <p className="text-[13px] text-[#a8a8a8]">{TYPE_HINTS[type]}</p>
        </div>
        {canAdd && (
          <Button
            label="Add"
            onClick={onAdd}
            className={cn(PRIMARY_BUTTON, "h-10 px-4 rounded-[10px] text-sm")}
          />
        )}
      </div>
      {methods.length === 0 ? (
        <p className="text-sm text-[#8a8a8a]">{`No ${label.toLowerCase()} saved yet.`}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {methods.map((m) => (
            <MethodRow
              key={m.id}
              method={m}
              onMakeDefault={() => onMakeDefault(m)}
              onVerify={() => onVerify(m)}
              onRemove={() => onRemove(m)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
