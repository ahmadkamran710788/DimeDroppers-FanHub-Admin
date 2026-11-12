"use client";

import { useState, type ReactNode } from "react";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import Modal from "@/components/common/modal";
import { useStripeElement } from "@/components/sponsor/stripe-element/use-stripe-element";
import { confirmCheckout, outcomeOf, type CheckoutOutcome } from "@/components/sponsor/checkout/settle-checkout";
import { formatCents } from "@/components/sponsor/sponsor-api";
import type { SponsorCheckout } from "@/utils/types/sponsor-payments";

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

interface CheckoutPaymentModalProps {
  // The payment waiting for Stripe's form (CONFIRM_PAYMENT, with its clientSecret); null = closed.
  checkout: SponsorCheckout | null;
  // What is being paid for, under the title.
  summary: ReactNode;
  // Where Stripe sends the sponsor back after a redirect-based method (Cash App, some banks).
  returnPath: (paymentId: string) => string;
  // The close button's label: checkout cancels the payment, My Sponsorships only closes.
  closeLabel: string;
  // Closed without paying.
  onClose: () => void;
  // Stripe took the payment and the backend was told: paid, bank processing, or not known yet.
  onDone: (outcome: CheckoutOutcome) => void;
}

// Stripe's Payment Element for one payment. A declined method can be fixed and tried again here until the
// payment's hold runs out.
export default function CheckoutPaymentModal({
  checkout,
  summary,
  returnPath,
  closeLabel,
  onClose,
  onDone,
}: CheckoutPaymentModalProps) {
  const { mountRef, handles, ready, loadError } = useStripeElement(checkout?.clientSecret ?? null);
  // A decline from Stripe, for the payment it happened on.
  const [payError, setPayError] = useState<{ id: string; message: string } | null>(null);
  const [paying, setPaying] = useState(false);

  const handleClose = () => {
    if (paying) return;
    setPayError(null);
    onClose();
  };

  const handlePay = async () => {
    const h = handles();
    if (!checkout || !h) return;
    setPaying(true);
    setPayError(null);
    const { error, paymentIntent } = await h.stripe.confirmPayment({
      elements: h.elements,
      confirmParams: { return_url: `${window.location.origin}${returnPath(checkout.id)}` },
      redirect: "if_required",
    });
    if (error) {
      setPayError({ id: checkout.id, message: error.message ?? "The payment didn't go through. Please try again." });
      setPaying(false);
      return;
    }
    const confirmed = await confirmCheckout(checkout.id, paymentIntent.id);
    setPaying(false);
    onDone(confirmed ? outcomeOf(confirmed) : { kind: "pending", checkout });
  };

  // A decline here, or an earlier one the backend recorded on this payment.
  const declined = (payError?.id === checkout?.id ? payError?.message : null) ?? checkout?.failureReason ?? null;

  return (
    <Modal
      isOpen={!!checkout}
      onClose={handleClose}
      title="Payment"
      className="max-w-[min(480px,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto"
    >
      {checkout && (
        <div className="w-full flex flex-col gap-5">
          <p className="text-midnight-navy/80 text-base leading-6">
            <span className="font-semibold">{formatCents(checkout.amountCents, checkout.currency)}</span> · {summary}
          </p>

          {!ready && !loadError && <Loader />}
          {loadError && <p className="text-sm text-red-600">{loadError}</p>}
          {/* Stripe draws the payment form in here (kept visible: a hidden mount may never report ready). */}
          <div ref={mountRef} className="w-full" />
          {declined && (
            <p role="alert" className="text-sm text-red-600">
              {declined}
            </p>
          )}

          <p className="text-[13px] text-midnight-navy/60">
            {checkout.expiresAt
              ? `Your sponsorships are held for you until ${fmtTime(checkout.expiresAt)}. They go live once paid.`
              : "Your sponsorships go live once paid."}
          </p>
          <div className="flex gap-3">
            <Button label={closeLabel} variant="secondary" onClick={handleClose} disabled={paying} fullWidth />
            <Button
              label={paying ? "Paying…" : `Pay ${formatCents(checkout.amountCents, checkout.currency)}`}
              variant="cta"
              onClick={handlePay}
              disabled={!ready || paying}
              fullWidth
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
