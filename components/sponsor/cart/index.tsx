"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import Loader from "@/components/common/loader";
import { CARD, LINK_BUTTON, OUTLINE_BUTTON, PRIMARY_BUTTON, SECTION_LABEL } from "@/components/sponsor/styles";
import ActivatedSummary, { type ActivatedDone } from "@/components/sponsor/checkout/activated-summary";
import CartLine from "@/components/sponsor/cart/cart-line";
import CheckoutPaymentModal from "@/components/sponsor/checkout/checkout-payment-modal";
import PaymentChoice from "@/components/sponsor/checkout/payment-choice";
import { toastOutcome, type CheckoutOutcome } from "@/components/sponsor/checkout/settle-checkout";
import { useCheckout } from "@/components/sponsor/checkout/use-checkout";
import { usePaymentReturn } from "@/components/sponsor/checkout/use-payment-return";
import type { ReturnedPayment } from "@/components/sponsor/checkout/returned-payment";
import { activeActivations, formatCents, sponsorRequest, type ActiveActivations } from "@/components/sponsor/sponsor-api";
import { useSponsorCart } from "@/context/sponsor-cart";
import { routes } from "@/utils/routes";
import type { SponsorCartActivation, SponsorCartQuote } from "@/utils/types/sponsor-packages";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

interface SponsorCartProps {
  // From ?payment=&payment_intent= (Stripe's return_url after a redirect-based method).
  returnedPayment?: ReturnedPayment;
}

// The sponsor's cart: every package and physical asset picked on Find Organizations, priced now
// (POST /activations/quote), and activated together (POST /activations/batch) as one payment: either every
// item starts once paid, or none does.
export default function SponsorCart({ returnedPayment }: SponsorCartProps) {
  const cart = useSponsorCart();
  const { lines } = cart;
  const items = useMemo(() => lines.map((l) => l.item), [lines]);
  const [quoted, setQuoted] = useState<{ key: string; quote?: SponsorCartQuote; error?: string } | null>(null);
  // Bumped to price the cart again (Retry, or after a refused Activate all).
  const [requotes, setRequotes] = useState(0);
  // The Activate all confirm is open; its payment and idempotency key are in useCheckout.
  const [confirming, setConfirming] = useState(false);
  const pay = useCheckout();
  // The batch answer while Stripe's form takes its payment.
  const [paying, setPaying] = useState<SponsorCartActivation | null>(null);
  const [clearing, setClearing] = useState(false);
  const [done, setDone] = useState<ActivatedDone | null>(null);

  // Paid or clearing: the cart is bought, so it empties. Otherwise it stays, to try again.
  const finish = (outcome: CheckoutOutcome, result?: SponsorCartActivation) => {
    const count = result?.activations.length;
    toastOutcome(outcome, count ? `${plural(count, "sponsorship")} activated` : "Payment received");
    if (outcome.kind !== "paid" && outcome.kind !== "processing") return false;
    cart.clear();
    setDone({ kind: outcome.kind, result, methodLabel: outcome.checkout?.methodLabel ?? null });
    return true;
  };

  usePaymentReturn(returnedPayment, routes.ui.sponsor.cart, (outcome) => finish(outcome));

  const quoteKey = `${JSON.stringify(items)}|${requotes}`;
  useEffect(() => {
    if (!items.length) return;
    let cancelled = false;
    sponsorRequest<SponsorCartQuote>("POST", routes.api.sponsorCartQuote, { body: { items } }).then((r) => {
      if (!cancelled) setQuoted({ key: quoteKey, quote: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [quoteKey, items]);

  // What the sponsor already has active, anywhere: a line without stores for one of those can't be
  // activated again. A line with stores can (for stores that don't have it); the quote names any that do.
  const [activeLoaded, setActiveLoaded] = useState<{ key: string; active: ActiveActivations } | null>(null);
  useEffect(() => {
    if (!items.length) return;
    let cancelled = false;
    activeActivations().then((active) => {
      // If it can't be checked, the cart isn't blocked.
      if (!cancelled) setActiveLoaded({ key: quoteKey, active: active ?? new Map() });
    });
    return () => {
      cancelled = true;
    };
  }, [quoteKey, items.length]);

  const current = quoted?.key === quoteKey ? quoted : null;
  const quote = current?.quote;
  const activeMap = activeLoaded?.key === quoteKey ? activeLoaded.active : null;
  const quoting = items.length > 0 && (!current || !activeMap);
  const isAlreadyActive = (line: (typeof lines)[number]) =>
    !line.item.sponsorLocationIds?.length && !!activeMap?.has(line.key);
  const alreadyActiveCount = lines.filter(isAlreadyActive).length;
  // Lines with stores to choose from but none ticked: an activation is always for at least one store.
  const needsStore = (line: (typeof lines)[number]) => !!line.stores && !line.item.sponsorLocationIds?.length;
  const needsStoreCount = lines.filter(needsStore).length;
  const currency = quote?.currency ?? lines[0]?.currency ?? "USD";

  // Line key → the new price, for every item whose price changed.
  const newPrices = Object.fromEntries(
    (quote?.items ?? [])
      .filter((q) => q.priceChanged && q.isAvailable && q.totalCents !== null && lines[q.index])
      .map((q) => [lines[q.index].key, q.totalCents as number])
  );
  const changedCount = Object.keys(newPrices).length;
  const unavailableCount = quote?.items.filter((q) => !q.isAvailable).length ?? 0;
  const organizationCount = new Set(lines.map((l) => l.organization.id)).size;

  // A $0 cart is live at once, with nothing to pay.
  const isPaid = (quote?.totalCents ?? 0) > 0;

  const activateAll = async () => {
    if (isPaid && !pay.choice) return false;
    const r = await sponsorRequest<SponsorCartActivation>("POST", routes.api.sponsorCartActivate, {
      body: isPaid ? { items, ...pay.choice } : { items },
      headers: { "Idempotency-Key": pay.key },
    });
    if (r.view) {
      const result = r.view;
      const outcome = await pay.settle(result.checkout);
      if (outcome.kind === "needs-form") {
        // The confirm closes; Stripe's form opens for the new method.
        setPaying(result);
        return true;
      }
      // Declined after Stripe's check: the confirm stays open, to pay another way.
      return finish(outcome, result) || outcome.kind !== "failed";
    }
    toast.error(r.message ?? "Couldn't activate your cart, please try again.");
    // Refused (an item can't be activated, a price changed, or the payment was declined): nothing was
    // charged; price the cart again so the lines show why, with a new key for the next attempt. Anything
    // else keeps the confirm open to retry with the same key.
    if (r.status === 400 || r.status === 409) {
      pay.renewKey();
      setRequotes((n) => n + 1);
      return true;
    }
    return false;
  };

  if (done)
    return (
      <ActivatedSummary
        done={done}
        actions={
          <>
            <Link href={routes.ui.sponsor.findOrganizations} className={cn(PRIMARY_BUTTON, LINK_BUTTON)}>
              Find more organizations
            </Link>
            <Link href={routes.ui.sponsor.mySponsorships} className={cn(OUTLINE_BUTTON, LINK_BUTTON)}>
              View my sponsorships
            </Link>
          </>
        }
      />
    );

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          CART
        </h2>
        <p className="text-base leading-[26px] text-[#e5e5e5]">
          Packages and physical assets from any organization, activated together: either every item starts, or none
          does.
        </p>
      </div>

      {lines.length === 0 ? (
        <div className={cn(CARD, "rounded-[8px] p-6 flex flex-col items-start gap-4")}>
          <p className="text-[15px] text-[#a8a8a8]">
            Your cart is empty. Add packages and physical assets from Find Organizations.
          </p>
          <Link href={routes.ui.sponsor.findOrganizations} className={cn(PRIMARY_BUTTON, LINK_BUTTON)}>
            Find organizations
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-6 items-start">
          <section aria-label="Cart items" className="flex-[2_1_480px] min-w-0 flex flex-col gap-3">
            {current?.error && (
              <div className={cn(CARD, "rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3")}>
                <p className="text-sm text-[#f0c36a]">{`Couldn't check the prices: ${current.error}`}</p>
                <Button
                  label="Retry"
                  onClick={() => setRequotes((n) => n + 1)}
                  className={cn(OUTLINE_BUTTON, "h-10 px-4 rounded-[10px] text-sm")}
                />
              </div>
            )}
            {lines.map((line, index) => (
              <CartLine
                key={line.key}
                line={line}
                quote={quote?.items.find((q) => q.index === index)}
                alreadyActive={isAlreadyActive(line)}
                onRemove={() => cart.remove(line.key)}
                onAcceptPrice={(totalCents) => cart.acceptPrices({ [line.key]: totalCents })}
                onStoresChange={(storeIds) => cart.setStores(line.key, storeIds)}
              />
            ))}
          </section>

          <aside
            aria-label="Cart summary"
            className={cn(CARD, "flex-[1_1_300px] min-w-0 rounded-[8px] p-4 lg:p-[26px] flex flex-col gap-4")}
          >
            <div className={SECTION_LABEL}>SUMMARY</div>
            <dl className="flex flex-col gap-2 text-[15px]">
              <div className="flex justify-between gap-3">
                <dt className="text-[#a8a8a8]">Items</dt>
                <dd>{lines.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#a8a8a8]">Organizations</dt>
                <dd>{organizationCount}</dd>
              </div>
            </dl>
            <div className="flex flex-col gap-1 border-t border-[#222] pt-4">
              <span className="text-[13px] text-[#a8a8a8]">Total at current prices</span>
              {quoting ? (
                <Loader />
              ) : (
                <span className="font-display font-extrabold text-[34px] leading-none">
                  {formatCents(quote?.totalCents ?? lines.reduce((sum, l) => sum + l.totalCents, 0), currency)}
                </span>
              )}
            </div>
            {unavailableCount > 0 && (
              <p className="text-[13px] text-[#f0c36a]">
                {`Remove the ${plural(unavailableCount, "item")} that can't be activated to continue.`}
              </p>
            )}
            {alreadyActiveCount > 0 && (
              <p className="text-[13px] text-[#f0c36a]">
                {`Remove the ${plural(alreadyActiveCount, "item")} you already have active to continue.`}
              </p>
            )}
            {needsStoreCount > 0 && (
              <p className="text-[13px] text-[#f0c36a]">
                {`Tick at least one store on ${plural(needsStoreCount, "item")} to continue.`}
              </p>
            )}
            {changedCount > 0 && (
              <Button
                label={changedCount === 1 ? "Accept the new price" : `Accept ${changedCount} new prices`}
                onClick={() => cart.acceptPrices(newPrices)}
                className={cn(OUTLINE_BUTTON, "h-12 px-[18px] rounded-[10px] text-[15px] font-semibold")}
              />
            )}
            <Button
              label="Activate all"
              onClick={() => {
                // Fresh saved methods and a new idempotency key: a retry of this confirm never pays twice.
                pay.start();
                setConfirming(true);
              }}
              disabled={quoting || !quote?.canActivate || alreadyActiveCount > 0 || needsStoreCount > 0}
              fullWidth
              className={cn(PRIMARY_BUTTON, "h-12 px-[22px] rounded-[10px] text-[15px]")}
            />
            <Button
              label="Clear cart"
              onClick={() => setClearing(true)}
              fullWidth
              className={cn(OUTLINE_BUTTON, "h-12 px-[18px] rounded-[10px] text-[15px] font-semibold")}
            />
          </aside>
        </div>
      )}

      <ConfirmModal
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        title="Activate all"
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        message={
          !quote
            ? ""
            : isPaid
              ? `Activate ${plural(lines.length, "item")} with ${plural(organizationCount, "organization")} for ${formatCents(quote.totalCents, currency)}, paid together? They go live once paid.`
              : `Activate ${plural(lines.length, "item")} with ${plural(organizationCount, "organization")}? They're free and start right away.`
        }
        confirmLabel={quote && isPaid ? `Pay ${formatCents(quote.totalCents, currency)}` : "Activate all"}
        busyLabel={isPaid ? "Paying…" : "Activating…"}
        onConfirm={activateAll}
        confirmDisabled={isPaid && !pay.choice}
      >
        {isPaid && <PaymentChoice checkout={pay} />}
      </ConfirmModal>
      <CheckoutPaymentModal
        checkout={pay.formCheckout}
        summary={`${plural(lines.length, "item")} with ${plural(organizationCount, "organization")}`}
        returnPath={routes.ui.sponsor.cartPaymentReturn}
        closeLabel="Cancel payment"
        onClose={() => {
          setPaying(null);
          pay.abandonForm().then(() => setRequotes((n) => n + 1));
        }}
        onDone={(outcome) => {
          const result = paying ?? undefined;
          pay.closeForm();
          setPaying(null);
          finish(outcome.kind === "needs-form" ? { kind: "pending", checkout: outcome.checkout } : outcome, result);
        }}
      />
      <ConfirmModal
        isOpen={clearing}
        onClose={() => setClearing(false)}
        title="Clear cart"
        message={`Remove all ${plural(lines.length, "item")} from your cart?`}
        confirmLabel="Clear cart"
        busyLabel="Clearing…"
        destructive
        onConfirm={async () => {
          cart.clear();
          return true;
        }}
      />
    </div>
  );
}
