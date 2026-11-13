"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Loader from "@/components/common/loader";
import { HINT_LINK } from "@/components/sponsor/styles";
import { DARK_APPEARANCE, useStripeElement } from "@/components/sponsor/stripe-element/use-stripe-element";
import { saveMethod } from "@/components/sponsor/payment-methods/methods-api";
import { ADD_COPY, DARK_FIELD, DARK_LABEL, GRADIENT_BUTTON } from "@/components/sponsor/billing-info/data";
import { cardNameSchema } from "@/components/sponsor/billing-info/schema";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { validateAndSetErrors } from "@/utils/validation";
import { routes } from "@/utils/routes";
import type { PaymentMethodType, SetupIntentStart } from "@/utils/types/sponsor-payments";

interface AddMethodPanelProps {
  type: PaymentMethodType;
  // With the sentence to confirm it with.
  onSaved: (notice: string) => void;
}

interface Started {
  view?: SetupIntentStart;
  error?: string;
  status: number;
}

// The open form of one "Add a payment method" row: the backend starts a SetupIntent for that type only,
// Stripe's form takes the details (they go to Stripe, never to us), then the backend saves it. Cash App Pay
// and some banks leave the page and come back to Billing Info, which saves it there. Mounted each time the
// row opens, so every opening starts a fresh SetupIntent.
export default function AddMethodPanel({ type, onSaved }: AddMethodPanelProps) {
  const copy = ADD_COPY[type];
  const [started, setStarted] = useState<Started | null>(null);
  const [holderName, setHolderName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    sponsorRequest<SetupIntentStart>("POST", routes.api.sponsorPaymentMethodSetupIntent, { body: { type } }).then(
      (r) => {
        if (!cancelled) setStarted({ view: r.view, error: r.view ? undefined : r.message, status: r.status });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [type]);

  const setup = started?.view ?? null;
  const { mountRef, handles, ready, loadError } = useStripeElement(setup?.clientSecret ?? null, DARK_APPEARANCE);

  const handleSave = async () => {
    const h = handles();
    if (!setup || !h) return;
    if (type === "CARD" && !(await validateAndSetErrors(cardNameSchema, { holderName }, setErrors))) return;
    setSaving(true);
    setSaveError(null);
    const { error } = await h.stripe.confirmSetup({
      elements: h.elements,
      confirmParams: {
        return_url: `${window.location.origin}${routes.ui.sponsor.billingInfoSetupReturn(setup.setupIntentId)}`,
      },
      redirect: "if_required",
    });
    if (error) {
      setSaveError(error.message ?? "Couldn't save this payment method. Please check the details and try again.");
      setSaving(false);
      return;
    }
    const name = holderName.trim();
    const saved = await saveMethod({ setupIntentId: setup.setupIntentId, ...(name && { holderName: name }) });
    setSaving(false);
    if (saved) onSaved(saved.notice);
  };

  return (
    <div className="flex flex-col gap-3.5">
      {copy.intro && <p className="text-sm leading-normal text-[#d4d4d8]">{copy.intro}</p>}
      {!started ? (
        <Loader />
      ) : !setup ? (
        <p className="text-sm text-[#fca5a5]">
          {started.error ?? "Couldn't start Stripe's form, please try again."}{" "}
          {started.status === 409 && (
            <Link href={routes.ui.sponsor.profile} className={HINT_LINK}>
              Open Sponsor Profile
            </Link>
          )}
        </p>
      ) : (
        <>
          {type === "CARD" && (
            <Input
              label="Name on card"
              name="cardHolderName"
              value={holderName}
              onChange={(e) => {
                setHolderName(e.target.value);
                if (errors.holderName) setErrors((prev) => ({ ...prev, holderName: "" }));
              }}
              placeholder="e.g. Your company name"
              autoComplete="cc-name"
              variant="dark"
              labelClassName={DARK_LABEL}
              inputClassName={DARK_FIELD}
              error={errors.holderName}
            />
          )}
          {!ready && !loadError && <Loader />}
          {loadError && (
            <p role="alert" className="text-[13px] text-[#fca5a5]">
              {loadError}
            </p>
          )}
          {/* Stripe draws the form in here (kept visible: a hidden mount may never report ready). */}
          <div ref={mountRef} className="w-full" />
          {saveError && (
            <p role="alert" className="text-[13px] text-[#fca5a5]">
              {saveError}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              label={saving ? "Saving…" : copy.save}
              onClick={handleSave}
              disabled={!ready || saving}
              className={cn(GRADIENT_BUTTON, copy.saveClassName)}
            />
            <span className="flex-[1_1_220px] text-xs text-[#a1a1aa]">{copy.note}</span>
          </div>
        </>
      )}
    </div>
  );
}
