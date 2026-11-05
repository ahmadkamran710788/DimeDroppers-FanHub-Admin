"use client";

import { useState } from "react";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import { FIELD, HINT, LABEL, amountInput } from "@/components/organization/fundable-needs/field-styles";
import { fundingSchema } from "@/components/organization/fundable-needs/schema";
import { validateAndSetErrors } from "@/utils/validation";
import type { FundableNeed } from "@/utils/types/fundable-need";

interface RecordFundingProps {
  need: FundableNeed;
  onCancel: () => void;
  onFund: (sponsor: string, amount: number) => void;
}

// Inline panel under a need: a sponsor's funding is loaded onto the need's card and the sponsor goes
// on the Fan Wall.
export default function RecordFunding({ need, onCancel, onFund }: RecordFundingProps) {
  const [sponsor, setSponsor] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit() {
    if (!(await validateAndSetErrors(fundingSchema, { sponsor, amount }, setErrors))) return;
    onFund(sponsor.trim(), Number(amount));
  }

  return (
    <div className="flex w-full flex-col gap-4 rounded-[8px] border border-white/15 bg-black/30 p-4">
      <div className="flex flex-wrap items-start gap-4">
        <Input
          label="Sponsor"
          name={`fund-sponsor-${need.id}`}
          value={sponsor}
          onChange={(e) => {
            setSponsor(e.target.value);
            if (errors.sponsor) setErrors((prev) => ({ ...prev, sponsor: "" }));
          }}
          placeholder="e.g. River City Smokehouse"
          error={errors.sponsor}
          className="flex-[2_1_240px]"
          labelClassName={LABEL}
          inputClassName={FIELD}
        />
        <Input
          label="Amount"
          name={`fund-amount-${need.id}`}
          value={amount}
          onChange={(e) => {
            const next = amountInput(e.target.value);
            if (next === null) return;
            setAmount(next);
            if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
          }}
          placeholder="0.00"
          inputMode="decimal"
          icon={<span className="text-base font-medium">$</span>}
          error={errors.amount}
          className="flex-[1_1_160px]"
          labelClassName={LABEL}
          inputClassName={FIELD}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="cta" label="Load card & add to wall" onClick={() => void submit()} />
        <Button label="Cancel" onClick={onCancel} />
        <p className={HINT}>
          {`The amount loads onto card •••• ${need.card.last4} and the sponsor appears on your Fan Wall instantly.`}
        </p>
      </div>
    </div>
  );
}
