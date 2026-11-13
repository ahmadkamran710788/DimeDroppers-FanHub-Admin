"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Check, Lock, X } from "lucide-react";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import Loader from "@/components/common/loader";
import { HINT_LINK } from "@/components/sponsor/styles";
import AddMethodPanel from "@/components/sponsor/billing-info/add-method-panel";
import AddMethodRow from "@/components/sponsor/billing-info/add-method-row";
import BillingDetails from "@/components/sponsor/billing-info/billing-details";
import BillingHistory from "@/components/sponsor/billing-info/billing-history";
import SavedMethodRow from "@/components/sponsor/billing-info/saved-method-row";
import { ADD_METHODS, PANEL, SECTION_HEADING, SMALL_OUTLINE_BUTTON } from "@/components/sponsor/billing-info/data";
import VerifyBankModal from "@/components/sponsor/payment-methods/verify-bank-modal";
import { METHOD_TYPES } from "@/components/sponsor/payment-methods/data";
import { makeDefault, removeMethod, saveMethod } from "@/components/sponsor/payment-methods/methods-api";
import { usePaymentMethods } from "@/components/sponsor/payment-methods/use-payment-methods";
import { stripeEnabled } from "@/utils/stripe";
import { routes } from "@/utils/routes";
import type { PaymentMethodType, SponsorPaymentMethod } from "@/utils/types/sponsor-payments";

// A method saved through Stripe's redirect (Cash App Pay, some banks), still to be saved here.
export interface ReturnedSetup {
  setupIntentId: string;
  // Stripe's redirect_status: "failed" when the sponsor didn't finish.
  failed: boolean;
}

interface BillingInfoProps {
  // From ?setup=<seti_…> (Stripe's return_url after a redirect-based method).
  returnedSetup?: ReturnedSetup;
}

// Billing Info (from the design): add a card, bank account, Cash App Pay or Link in Stripe's form (the numbers
// go to Stripe only), pick each type's default (the API keeps one default per type), see who the sponsor is
// billed as, and every payment made for activations.
export default function BillingInfo({ returnedSetup }: BillingInfoProps) {
  const { methods, options, error, errorStatus, loading, reload } = usePaymentMethods();
  // The green banner at the top, after a save, default change or removal.
  const [notice, setNotice] = useState<string | null>(null);
  // The open "Add" row; `n` remounts its form, so every opening starts a fresh SetupIntent.
  const [adding, setAdding] = useState<{ type: PaymentMethodType; n: number } | null>(null);
  const [verifying, setVerifying] = useState<SponsorPaymentMethod | null>(null);
  const [removing, setRemoving] = useState<SponsorPaymentMethod | null>(null);
  // The method whose default change is on its way.
  const [defaulting, setDefaulting] = useState<string | null>(null);
  const handledSetup = useRef(false);
  const canAddAny = stripeEnabled();

  // Back from Stripe: saves the method once, even when the effect runs twice in development, and drops
  // Stripe's parameters so a refresh doesn't save it again.
  useEffect(() => {
    if (!returnedSetup || handledSetup.current) return;
    handledSetup.current = true;
    window.history.replaceState(null, "", routes.ui.sponsor.billingInfo);
    if (returnedSetup.failed) {
      toast.error("The payment method wasn't added. Please try again.");
      return;
    }
    saveMethod({ setupIntentId: returnedSetup.setupIntentId }).then((saved) => {
      if (saved) setNotice(saved.notice);
      reload();
    });
  }, [returnedSetup, reload]);

  const optionOf = (type: PaymentMethodType) => options?.types.find((t) => t.type === type);

  // Why a type can't be added right now, or undefined when it can.
  const blockedReason = (type: PaymentMethodType) => {
    if (!canAddAny) return "Adding payment methods isn't available right now.";
    const option = optionOf(type);
    if (option && option.saved >= option.maxSaved)
      return `You've saved ${option.maxSaved} of these, the most allowed. Remove one to add another.`;
    return undefined;
  };

  const handleMakeDefault = async (m: SponsorPaymentMethod) => {
    setDefaulting(m.id);
    const done = await makeDefault(m);
    setDefaulting(null);
    if (done) {
      setNotice(done);
      reload();
    }
  };

  // Saved methods by type (the API keeps one default per type), each type's own radio group.
  const groups = METHOD_TYPES.map((type) => ({ type, items: methods?.filter((m) => m.type === type) ?? [] })).filter(
    (g) => g.items.length > 0
  );
  const paysWith = methods
    ?.filter((m) => m.isDefault)
    .map((m) => m.label)
    .join(", ");

  return (
    <div className="w-full max-w-[880px] flex flex-col gap-7">
      <div className="flex flex-col gap-2.5">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          BILLING INFO
        </h2>
        <p className="max-w-[640px] text-base sm:text-[17px] leading-[1.55] text-[#a1a1aa]">
          Manage how you pay for sponsorship packages. Your information is securely stored with Stripe.
        </p>
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-[10px] border border-[#14532d] bg-[#052e16] pl-4 pr-1 py-1 text-sm text-[#bbf7d0]"
        >
          <Check className="shrink-0 size-[18px] text-[#22c55e]" strokeWidth={2.4} aria-hidden />
          <span className="flex-1 py-2">{notice}</span>
          <Button
            size="icon"
            variant="text"
            icon={<X className="size-4" />}
            aria-label="Dismiss"
            onClick={() => setNotice(null)}
            className="size-9 text-[#bbf7d0] hover:text-white"
          />
        </div>
      )}

      <section aria-labelledby="add-method-title" className="flex flex-col gap-3.5">
        <h3 id="add-method-title" className={SECTION_HEADING}>
          Add a payment method
        </h3>
        {ADD_METHODS.map((option) => {
          const open = adding?.type === option.type;
          return (
            <AddMethodRow
              key={option.type}
              option={option}
              open={open}
              blockedReason={blockedReason(option.type)}
              onToggle={() => setAdding((prev) => (open ? null : { type: option.type, n: (prev?.n ?? 0) + 1 }))}
            >
              {open && adding && (
                <AddMethodPanel
                  key={adding.n}
                  type={option.type}
                  onSaved={(saved) => {
                    setAdding(null);
                    setNotice(saved);
                    reload();
                  }}
                />
              )}
            </AddMethodRow>
          );
        })}
      </section>

      <section aria-labelledby="saved-methods-title" className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 id="saved-methods-title" className={SECTION_HEADING}>
            Saved payment methods
          </h3>
          <span className="text-[13px] text-[#a1a1aa]">Choose a default for each type</span>
        </div>
        {loading ? (
          <Loader />
        ) : error ? (
          <div className={cn(PANEL, "p-4 sm:px-5 flex flex-wrap items-center justify-between gap-3")}>
            <p className="text-sm text-[#f0c36a]">
              {error}{" "}
              {errorStatus === 409 && (
                <Link href={routes.ui.sponsor.profile} className={HINT_LINK}>
                  Open Sponsor Profile
                </Link>
              )}
            </p>
            <Button label="Retry" onClick={reload} className={SMALL_OUTLINE_BUTTON} />
          </div>
        ) : groups.length === 0 ? (
          <p className="rounded-[16px] border border-dashed border-[#2a2c33] bg-[#121317] p-[22px] text-center text-[#a1a1aa]">
            No payment methods yet. Add one above to check out.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((g) => (
              <div
                key={g.type}
                role="radiogroup"
                aria-label={`Default ${g.items[0].typeLabel.toLowerCase()}`}
                className="flex flex-col gap-3"
              >
                {g.items.map((m) => (
                  <SavedMethodRow
                    key={m.id}
                    method={m}
                    busy={defaulting !== null}
                    onMakeDefault={() => handleMakeDefault(m)}
                    onVerify={() => setVerifying(m)}
                    onRemove={() => setRemoving(m)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      <BillingDetails paysWith={paysWith} />

      <BillingHistory />

      <p className="flex items-center justify-center gap-2 text-sm text-[#a1a1aa]">
        <Lock className="size-4" strokeWidth={1.8} aria-hidden />
        Your information is encrypted and secure.
      </p>

      <VerifyBankModal
        method={verifying}
        onClose={() => setVerifying(null)}
        onVerified={() => {
          setVerifying(null);
          reload();
        }}
      />
      <ConfirmModal
        isOpen={!!removing}
        onClose={() => setRemoving(null)}
        title="Remove"
        message={
          removing
            ? `Remove ${removing.label}?${removing.isDefault ? ` Your newest other ${removing.typeLabel.toLowerCase()} becomes the default.` : ""}`
            : ""
        }
        confirmLabel="Remove"
        busyLabel="Removing…"
        destructive
        onConfirm={async () => {
          if (!removing) return false;
          const removed = await removeMethod(removing);
          if (removed) {
            const next = removed.newDefaultId && methods?.find((m) => m.id === removed.newDefaultId);
            setNotice(`${removing.label} was removed.${next ? ` ${next.label} is now your default.` : ""}`);
          }
          reload();
          return !!removed;
        }}
      />
    </div>
  );
}
