"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import { parseMoney } from "@/utils/helper";
import { routes } from "@/utils/routes";
import { stripeEnabled } from "@/utils/stripe";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Textarea from "@/components/common/textarea";
import OrgMonogram from "@/components/sponsor/find-organizations/org-monogram";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { FIELD, PRIMARY_BUTTON, SECTION_LABEL } from "@/components/sponsor/styles";
import PaymentModal, { type StartedPayment } from "@/components/sponsor/fundable-needs/payment-modal";
import { fundSchema } from "@/components/sponsor/fundable-needs/schema";
import {
  BRAND_DISPLAY_OPTIONS,
  MIN_CONTRIBUTION_CENTS,
  NOTE_MAX,
  PRESET_AMOUNTS_CENTS,
  dollars,
} from "@/components/sponsor/fundable-needs/data";
import type { BrandDisplay, SponsorNeedListItem, StartContributionResult } from "@/utils/types/needs";

// Picking a need starts the panel on the $500 preset when the need still lacks more than that.
const DEFAULT_PRESET_CENTS = 50000;

interface FundPanelProps {
  // The parent remounts the panel (key) for another need, so the amount and note start over.
  need: SponsorNeedListItem;
  // A payment went through (or is processing): the lists and stats reload.
  onFunded: () => void;
  // The need can't be funded any more (409, e.g. someone else filled it): the list reloads.
  onStale: () => void;
}

// Fund the selected need: an amount (a preset, the rest of the goal, or typed), how the brand is shown and
// a note, then Stripe's payment form (PaymentModal).
export default function FundPanel({ need, onFunded, onStale }: FundPanelProps) {
  const remaining = need.money.remainingToGoalCents;
  // The presets below what's left, then "Fund rest".
  const amounts = [...PRESET_AMOUNTS_CENTS.filter((cents) => cents < remaining), remaining];
  const defaultIndex = amounts.includes(DEFAULT_PRESET_CENTS)
    ? amounts.indexOf(DEFAULT_PRESET_CENTS)
    : amounts.length - 1;

  const [amountIndex, setAmountIndex] = useState(defaultIndex);
  // A typed amount wins over the picked one.
  const [customAmount, setCustomAmount] = useState("");
  const [brandDisplay, setBrandDisplay] = useState<BrandDisplay>(BRAND_DISPLAY_OPTIONS[0].value);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<StartedPayment | null>(null);
  // One Idempotency-Key per payment attempt: a retry after a network error (or Fund again after closing the
  // payment form) with the same details gets the same payment back instead of a second one.
  const attemptKey = useRef<string | null>(null);

  const typed = customAmount.trim() !== "";
  const amountCents = typed ? Math.round(parseMoney(customAmount) * 100) : amounts[amountIndex];
  const canPay = stripeEnabled();

  // Any change to what is being paid starts a new attempt.
  const changed = (field?: "amountCents" | "note") => {
    attemptKey.current = null;
    if (field && errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleFund = async () => {
    if (!canPay || submitting) return;
    if (!(await validateAndSetErrors(fundSchema(remaining), { amountCents, note }, setErrors))) return;

    setSubmitting(true);
    attemptKey.current ??= crypto.randomUUID();
    const trimmed = note.trim();
    const r = await sponsorRequest<StartContributionResult>("POST", routes.api.sponsorNeedContributions(need.id), {
      body: { amountCents, brandDisplay, ...(trimmed && { note: trimmed }) },
      headers: { "Idempotency-Key": attemptKey.current },
    });
    setSubmitting(false);

    if (r.view) {
      setPayment({
        contributionId: r.view.contribution.id,
        clientSecret: r.view.clientSecret,
        amountCents,
        needTitle: need.title,
        orgName: need.organization.name ?? "the organization",
      });
      return;
    }
    toast.error(r.message ?? "Couldn't start the payment, please try again.");
    // Funded, ended or closed in the meantime.
    if (r.status === 409) {
      onStale();
      return;
    }
    // 400: mark the fields the backend named.
    const fieldErrors: Record<string, string> = {};
    for (const e of r.errors ?? []) {
      if (e.path === "amountCents" || e.path === "note") fieldErrors[e.path] = e.message;
    }
    if (Object.keys(fieldErrors).length) setErrors((prev) => ({ ...prev, ...fieldErrors }));
  };

  const paid = () => {
    setPayment(null);
    attemptKey.current = null;
    setCustomAmount("");
    setNote("");
    onFunded();
  };

  const validAmount = Number.isFinite(amountCents) && amountCents > 0;

  return (
    // box-content: the design's 340px basis is the content box, which sets how the row splits.
    <aside
      aria-label="Fund this need"
      className="box-content flex-[1_1_340px] min-w-0 bg-[#141414] border border-[#2c2547] rounded-[8px] p-6 flex flex-col gap-5"
    >
      <div className="flex gap-4 items-start">
        <OrgMonogram logoUrl={need.organization.logoUrl} size="md" />
        <div className="min-w-0">
          <div className="text-[13px] tracking-[1px] text-[#a8a8a8] font-semibold">FUND THIS NEED</div>
          <div className="font-display font-extrabold text-2xl leading-tight mt-1 break-words">{need.title}</div>
          <div className="text-[15px] text-[#c4c4c4] mt-1">
            {need.organization.name} · {dollars(remaining)} still needed
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[10px]">
        <div className={SECTION_LABEL}>AMOUNT</div>
        <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-[10px]">
          {amounts.map((cents, i) => {
            const on = !typed && amountIndex === i;
            return (
              <Button
                key={i}
                label={i === amounts.length - 1 ? `Fund rest · ${dollars(cents)}` : dollars(cents)}
                onClick={() => {
                  setAmountIndex(i);
                  setCustomAmount("");
                  changed("amountCents");
                }}
                aria-pressed={on}
                fullWidth
                className={cn(
                  "h-12 min-w-0 px-[6px] rounded-[10px] text-[15px] font-semibold border backdrop-blur-none transition-none",
                  on ? "bg-[#2a2148] text-white border-[#8b6dff]" : "bg-[#0b0b0b] text-[#e0e0e0] border-[#333]"
                )}
              />
            );
          })}
        </div>
        <Input
          label="Or enter an amount"
          name="amount"
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value);
            changed("amountCents");
          }}
          placeholder={`$ ${dollars(MIN_CONTRIBUTION_CENTS)} to ${dollars(remaining)}`}
          inputMode="decimal"
          error={errors.amountCents}
          className="gap-[10px] mt-1"
          labelClassName="text-[14px] font-normal text-[#c4c4c4]"
          inputClassName={cn(FIELD, "h-12 py-0 px-[14px] text-[16px] placeholder:text-[#757575]")}
        />
      </div>

      <Select
        label="SHOW MY BRAND AS"
        name="brandDisplay"
        value={brandDisplay}
        onChange={(e) => {
          setBrandDisplay(e.target.value as BrandDisplay);
          changed();
        }}
        options={BRAND_DISPLAY_OPTIONS}
        variant="dark"
        labelClassName={SECTION_LABEL}
        selectClassName={cn(FIELD, "h-12 px-3 text-[16px]")}
      />

      <Textarea
        label="NOTE TO THE ORGANIZATION"
        name="note"
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          changed("note");
        }}
        placeholder="Optional message"
        maxLength={NOTE_MAX}
        rows={3}
        showCounter={false}
        fieldVariant="dark"
        error={errors.note}
        labelClassName={SECTION_LABEL}
        fieldClassName={cn(FIELD, "px-[14px] py-3 text-[15px] resize-y placeholder:text-[#757575]")}
      />

      <Button
        label={submitting ? "Starting payment…" : validAmount ? `Fund ${dollars(amountCents)}` : "Fund"}
        onClick={handleFund}
        disabled={!canPay || submitting}
        fullWidth
        className={cn(PRIMARY_BUTTON, "h-[54px] px-[6px] rounded-[12px] text-[17px] disabled:opacity-50")}
      />
      <div className="text-[13px] text-[#a8a8a8] text-center">
        {canPay ? "Unused funds are refunded to you automatically after the event." : "Payments open soon."}
      </div>

      <PaymentModal payment={payment} onClose={() => setPayment(null)} onDone={paid} />
    </aside>
  );
}
