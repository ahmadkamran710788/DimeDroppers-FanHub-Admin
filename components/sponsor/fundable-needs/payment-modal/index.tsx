"use client";

import { useEffect, useRef, useState } from "react";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import Modal from "@/components/common/modal";
import { confirmContribution } from "@/components/sponsor/fundable-needs/confirm-contribution";
import { dollars } from "@/components/sponsor/fundable-needs/data";
import { getStripe } from "@/utils/stripe";
import { routes } from "@/utils/routes";

// A payment the backend has started (POST /contributions), waiting for the sponsor to pay it.
export interface StartedPayment {
  contributionId: string;
  clientSecret: string;
  amountCents: number;
  needTitle: string;
  orgName: string;
}

interface PaymentModalProps {
  // null = closed.
  payment: StartedPayment | null;
  // Closed without paying: the payment stays unpaid, and Fund with the same details reopens it.
  onClose: () => void;
  // Stripe took the payment and the backend was told (whatever it answered).
  onDone: () => void;
}

// Stripe's Payment Element for one payment. A redirect-based method (some banks, 3-D Secure) leaves the page
// and comes back to the Fundable Needs page, which confirms it there.
export default function PaymentModal({ payment, onClose, onDone }: PaymentModalProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  // The client secret the form below was built for (it's rebuilt for another payment).
  const [readyFor, setReadyFor] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const clientSecret = payment?.clientSecret ?? null;

  useEffect(() => {
    if (!clientSecret) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;
    getStripe().then((stripe) => {
      if (cancelled) return;
      if (!stripe || !mountRef.current) {
        setLoadError("Payments aren't available right now. Please try again later.");
        return;
      }
      const elements = stripe.elements({
        clientSecret,
        appearance: { theme: "stripe", variables: { colorPrimary: "#6a4be6", borderRadius: "10px" } },
      });
      const element = elements.create("payment", { layout: "tabs" });
      element.on("ready", () => {
        if (!cancelled) setReadyFor(clientSecret);
      });
      element.on("loaderror", (e) => {
        if (!cancelled) setLoadError(e.error.message ?? "The payment form couldn't load. Please try again.");
      });
      element.mount(mountRef.current);
      stripeRef.current = stripe;
      elementsRef.current = elements;
      destroy = () => element.destroy();
    });
    return () => {
      cancelled = true;
      destroy?.();
      elementsRef.current = null;
    };
  }, [clientSecret]);

  const reset = () => {
    setReadyFor(null);
    setLoadError(null);
    setPayError(null);
    setPaying(false);
  };

  const handleClose = () => {
    if (paying) return;
    reset();
    onClose();
  };

  const handlePay = async () => {
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!payment || !stripe || !elements) return;
    setPaying(true);
    setPayError(null);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${routes.ui.sponsor.fundableNeedsTab("funded", payment.contributionId)}`,
      },
      redirect: "if_required",
    });
    if (error) {
      // A declined card and the like: the sponsor can fix it and pay again with the same payment.
      setPayError(error.message ?? "The payment didn't go through. Please try again.");
      setPaying(false);
      return;
    }
    await confirmContribution(payment.contributionId, paymentIntent.id);
    reset();
    onDone();
  };

  const ready = !!clientSecret && readyFor === clientSecret && !loadError;

  return (
    <Modal
      isOpen={!!payment}
      onClose={handleClose}
      title="Fund this need"
      className="max-w-[min(480px,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto"
    >
      {payment && (
        <div className="w-full flex flex-col gap-5">
          <p className="text-midnight-navy/80 text-base leading-6">
            <span className="font-semibold">{dollars(payment.amountCents)}</span> for{" "}
            <span className="font-semibold">{payment.needTitle}</span> · {payment.orgName}
          </p>

          {!ready && !loadError && <Loader />}
          {loadError && <p className="text-sm text-red-600">{loadError}</p>}
          {/* Stripe draws the payment form in here (kept visible: a hidden mount may never report ready). */}
          <div ref={mountRef} className="w-full" />
          {payError && (
            <p role="alert" className="text-sm text-red-600">
              {payError}
            </p>
          )}

          <p className="text-[13px] text-midnight-navy/60">
            Unused funds are refunded to you automatically after the event.
          </p>
          <div className="flex gap-3">
            <Button label="Cancel" variant="secondary" onClick={handleClose} disabled={paying} fullWidth />
            <Button
              label={paying ? "Paying…" : `Pay ${dollars(payment.amountCents)}`}
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
