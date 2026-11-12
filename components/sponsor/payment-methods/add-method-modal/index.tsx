"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/common/button";
import Checkbox from "@/components/common/checkbox";
import Input from "@/components/common/input";
import Loader from "@/components/common/loader";
import Modal from "@/components/common/modal";
import { useStripeElement } from "@/components/sponsor/stripe-element/use-stripe-element";
import { saveMethod } from "@/components/sponsor/payment-methods/methods-api";
import { addMethodSchema } from "@/components/sponsor/payment-methods/schema";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { validateAndSetErrors } from "@/utils/validation";
import { routes } from "@/utils/routes";
import type { PaymentMethodType, SetupIntentStart, SponsorPaymentMethod } from "@/utils/types/sponsor-payments";

interface AddMethodModalProps {
  type: PaymentMethodType;
  typeLabel: string;
  // The first usable method of a type becomes its default anyway; this asks for it on a later one.
  hasDefault: boolean;
  onClose: () => void;
  onSaved: (method: SponsorPaymentMethod) => void;
}

interface Started {
  view?: SetupIntentStart;
  error?: string;
  status: number;
}

// Adds one payment method of one type: the backend starts a SetupIntent for that type only, Stripe's form
// takes the details (they go to Stripe, never to us), then the backend saves it. Cash App Pay and some banks
// leave the page and come back to Payment Methods, which saves it there. Mount it to open it (a fresh
// SetupIntent each time).
export default function AddMethodModal({ type, typeLabel, hasDefault, onClose, onSaved }: AddMethodModalProps) {
  const [started, setStarted] = useState<Started | null>(null);
  const [holderName, setHolderName] = useState("");
  const [setDefault, setSetDefault] = useState(false);
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
  const { mountRef, handles, ready, loadError } = useStripeElement(setup?.clientSecret ?? null);

  const handleClose = () => {
    if (!saving) onClose();
  };

  const handleSave = async () => {
    const h = handles();
    if (!setup || !h) return;
    if (!(await validateAndSetErrors(addMethodSchema, { holderName }, setErrors))) return;
    setSaving(true);
    setSaveError(null);
    const { error } = await h.stripe.confirmSetup({
      elements: h.elements,
      confirmParams: {
        return_url: `${window.location.origin}${routes.ui.sponsor.paymentMethodsSetupReturn(setup.setupIntentId)}`,
      },
      redirect: "if_required",
    });
    if (error) {
      setSaveError(error.message ?? "Couldn't save this payment method. Please check the details and try again.");
      setSaving(false);
      return;
    }
    const name = holderName.trim();
    const saved = await saveMethod({
      setupIntentId: setup.setupIntentId,
      ...(name && { holderName: name }),
      ...(setDefault && { setDefault: true }),
    });
    setSaving(false);
    if (saved) onSaved(saved);
  };

  return (
    <Modal
      isOpen
      onClose={handleClose}
      title={`Add ${typeLabel}`}
      className="max-w-[min(480px,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto"
    >
      <div className="w-full flex flex-col gap-5">
        {!started ? (
          <Loader />
        ) : !setup ? (
          <p className="text-sm text-red-600">
            {started.error ?? "Couldn't start Stripe's form, please try again."}{" "}
            {started.status === 409 && (
              <Link href={routes.ui.sponsor.profile} className="underline font-semibold">
                Open Sponsor Profile
              </Link>
            )}
          </p>
        ) : (
          <>
            {!ready && !loadError && <Loader />}
            {loadError && <p className="text-sm text-red-600">{loadError}</p>}
            {/* Stripe draws the form in here (kept visible: a hidden mount may never report ready). */}
            <div ref={mountRef} className="w-full" />
            <Input
              label="Name on the account (optional)"
              name="holderName"
              value={holderName}
              onChange={(e) => {
                setHolderName(e.target.value);
                if (errors.holderName) setErrors((prev) => ({ ...prev, holderName: "" }));
              }}
              placeholder="e.g. Your company name"
              maxLength={100}
              error={errors.holderName}
            />
            {hasDefault && (
              // The tick's clickable label, not an action button.
              <button
                type="button"
                role="checkbox"
                aria-checked={setDefault}
                onClick={() => setSetDefault((v) => !v)}
                className="self-start flex items-center gap-2 text-sm text-midnight-navy/80"
              >
                <Checkbox checked={setDefault} variant="violet" />
                Make this my default
              </button>
            )}
            {saveError && (
              <p role="alert" className="text-sm text-red-600">
                {saveError}
              </p>
            )}
          </>
        )}
        <p className="text-[13px] text-midnight-navy/60">
          Your details go straight to Stripe and are never stored by Dime Sponsors.
        </p>
        <div className="flex gap-3">
          <Button label="Cancel" variant="secondary" onClick={handleClose} disabled={saving} fullWidth />
          <Button
            label={saving ? "Saving…" : "Save"}
            variant="cta"
            onClick={handleSave}
            disabled={!ready || saving}
            fullWidth
          />
        </div>
      </div>
    </Modal>
  );
}
