"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import Loader from "@/components/common/loader";
import Tabs from "@/components/common/tabs";
import { CARD, HINT_LINK, OUTLINE_BUTTON } from "@/components/sponsor/styles";
import AddMethodModal from "@/components/sponsor/payment-methods/add-method-modal";
import MethodGroup from "@/components/sponsor/payment-methods/method-group";
import PaymentHistory from "@/components/sponsor/payment-methods/payment-history";
import VerifyBankModal from "@/components/sponsor/payment-methods/verify-bank-modal";
import { METHOD_TYPES, TYPE_LABELS } from "@/components/sponsor/payment-methods/data";
import { makeDefault, removeMethod, saveMethod } from "@/components/sponsor/payment-methods/methods-api";
import { usePaymentMethods } from "@/components/sponsor/payment-methods/use-payment-methods";
import { stripeEnabled } from "@/utils/stripe";
import { routes } from "@/utils/routes";
import type { PaymentMethodType, SponsorPaymentMethod } from "@/utils/types/sponsor-payments";

export type PaymentMethodsTab = "methods" | "history";

const TABS: PaymentMethodsTab[] = ["methods", "history"];
const TAB_LABELS: Record<PaymentMethodsTab, string> = {
  methods: "Payment methods",
  history: "Payment history",
};

// A method saved through Stripe's redirect (Cash App Pay, some banks), still to be saved here.
export interface ReturnedSetup {
  setupIntentId: string;
  // Stripe's redirect_status: "failed" when the sponsor didn't finish.
  failed: boolean;
}

interface PaymentMethodsProps {
  // From ?tab=.
  initialTab?: PaymentMethodsTab;
  // From ?setup=<seti_…> (Stripe's return_url after a redirect-based method).
  returnedSetup?: ReturnedSetup;
}

// The sponsor's saved payment methods: a card, bank account, Cash App Pay or Link, added once in Stripe's
// form (the numbers go to Stripe only) and picked at checkout. One default per type. And every payment made
// for activations. Designed here, not from a mockup yet: keep it easy to restyle.
export default function PaymentMethods({ initialTab = "methods", returnedSetup }: PaymentMethodsProps) {
  const [tab, setTab] = useState<PaymentMethodsTab>(initialTab);
  const { methods, options, error, errorStatus, loading, reload } = usePaymentMethods();
  // The type being added; `n` remounts the form, so every Add starts a fresh SetupIntent.
  const [adding, setAdding] = useState<{ type: PaymentMethodType; n: number } | null>(null);
  const [verifying, setVerifying] = useState<SponsorPaymentMethod | null>(null);
  const [removing, setRemoving] = useState<SponsorPaymentMethod | null>(null);
  const handledSetup = useRef(false);
  const canAddAny = stripeEnabled();

  function open(next: PaymentMethodsTab) {
    setTab(next);
    // Keeps the tab on a refresh or a copied link, without a navigation.
    window.history.replaceState(null, "", routes.ui.sponsor.paymentMethodsTab(next));
  }

  // Back from Stripe: saves the method once, even when the effect runs twice in development, and drops
  // Stripe's parameters so a refresh doesn't save it again.
  useEffect(() => {
    if (!returnedSetup || handledSetup.current) return;
    handledSetup.current = true;
    window.history.replaceState(null, "", routes.ui.sponsor.paymentMethodsTab("methods"));
    if (returnedSetup.failed) {
      toast.error("The payment method wasn't added. Please try again.");
      return;
    }
    saveMethod({ setupIntentId: returnedSetup.setupIntentId }).then(() => reload());
  }, [returnedSetup, reload]);

  const ofType = (type: PaymentMethodType) => methods?.filter((m) => m.type === type) ?? [];
  const optionOf = (type: PaymentMethodType) => options?.types.find((t) => t.type === type);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          PAYMENT METHODS
        </h2>
        <p className="text-base leading-[26px] text-[#e5e5e5]">
          Save a card, bank account, Cash App Pay or Link once, then pay for sponsorships without entering it again.
          Your numbers go to Stripe only.
        </p>
      </div>

      <section className="flex flex-col gap-6">
        <Tabs tabs={TABS} active={tab} onChange={open} labels={TAB_LABELS} />

        {tab === "history" ? (
          <PaymentHistory />
        ) : loading ? (
          <Loader />
        ) : error ? (
          <div className={cn(CARD, "rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3")}>
            <p className="text-sm text-[#f0c36a]">
              {error}{" "}
              {errorStatus === 409 && (
                <Link href={routes.ui.sponsor.profile} className={HINT_LINK}>
                  Open Sponsor Profile
                </Link>
              )}
            </p>
            <Button label="Retry" onClick={reload} className={cn(OUTLINE_BUTTON, "h-10 px-4 rounded-[10px] text-sm")} />
          </div>
        ) : (
          <>
            {!canAddAny && (
              <p className="text-sm text-[#f0c36a]">Adding payment methods isn&apos;t available right now.</p>
            )}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
              {METHOD_TYPES.map((type) => {
                const option = optionOf(type);
                const saved = ofType(type);
                return (
                  <MethodGroup
                    key={type}
                    type={type}
                    label={option?.label ?? TYPE_LABELS[type]}
                    methods={saved}
                    maxSaved={option?.maxSaved}
                    canAdd={canAddAny && (!option || option.saved < option.maxSaved)}
                    onAdd={() => setAdding((prev) => ({ type, n: (prev?.n ?? 0) + 1 }))}
                    onMakeDefault={(m) => makeDefault(m).then((ok) => ok && reload())}
                    onVerify={setVerifying}
                    onRemove={setRemoving}
                  />
                );
              })}
            </div>
          </>
        )}
      </section>

      {adding && (
        <AddMethodModal
          key={adding.n}
          type={adding.type}
          typeLabel={optionOf(adding.type)?.label ?? TYPE_LABELS[adding.type]}
          hasDefault={ofType(adding.type).some((m) => m.isDefault)}
          onClose={() => setAdding(null)}
          onSaved={() => {
            setAdding(null);
            reload();
          }}
        />
      )}
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
          const ok = await removeMethod(removing);
          reload();
          return ok;
        }}
      />
    </div>
  );
}
