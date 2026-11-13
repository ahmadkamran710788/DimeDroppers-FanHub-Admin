"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import { plural } from "@/utils/helper";
import { routes } from "@/utils/routes";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import SectionCard from "@/components/common/section-card";
import { dollars } from "@/utils/needs";
import { HINT, OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import type { ActivatedDone } from "@/components/sponsor/checkout/activated-summary";
import CheckoutPaymentModal from "@/components/sponsor/checkout/checkout-payment-modal";
import PaymentChoice from "@/components/sponsor/checkout/payment-choice";
import { toastOutcome, type CheckoutOutcome } from "@/components/sponsor/checkout/settle-checkout";
import { useCheckout } from "@/components/sponsor/checkout/use-checkout";
import { formatCents, sponsorRequest } from "@/components/sponsor/sponsor-api";
import type { PlanEntry } from "@/components/sponsor/campaign-planner/plan-items";
import { useSponsorCart } from "@/context/sponsor-cart";
import type { SponsorCartActivation, SponsorCartItem, SponsorCartQuote } from "@/utils/types/sponsor-packages";

const COMING_SOON = "Coming soon";
const SECONDARY = cn(OUTLINE_BUTTON, "flex-[1_1_120px] h-[52px] px-4 rounded-[12px] text-[15px] font-semibold");

// The priced plan the confirm is open for: the items as they'll be sent (at the quote's prices).
interface Confirming {
  quote: SponsorCartQuote;
  items: SponsorCartItem[];
  organizationCount: number;
  // Items whose price changed since the plan was built.
  changedCount: number;
}

interface LaunchPanelProps {
  // The cart items of the lines still in the plan.
  entries: PlanEntry[];
  // Lines in the plan.
  count: number;
  totalCents: number;
  // Still finding out what the sponsor already has active.
  checking: boolean;
  // Why buying is held back (lines already active), or null.
  blockedReason: string | null;
  // What the last price check found per line (line index → text); empty when every item can be bought.
  onProblems: (notes: Map<number, string>) => void;
  // The plan was paid (or a bank payment is clearing).
  onBought: (done: ActivatedDone) => void;
}

// The plan's total and what can be done with it, on the cart's endpoints (FANHUB_SPONSOR_PLAN_CHECKOUT_FRONTEND.md):
// Buy full package prices every line still in the plan (POST /activations/quote) and buys them together as one
// payment (POST /activations/batch); Add to cart puts them in the browser cart. Saving and exporting a plan have
// no API yet ("Coming soon").
export default function LaunchPanel({
  entries,
  count,
  totalCents,
  checking,
  blockedReason,
  onProblems,
  onBought,
}: LaunchPanelProps) {
  const cart = useSponsorCart();
  const pay = useCheckout();
  const [pricing, setPricing] = useState(false);
  const [confirming, setConfirming] = useState<Confirming | null>(null);
  // The batch answer while Stripe's form takes its payment.
  const [paying, setPaying] = useState<SponsorCartActivation | null>(null);

  const allInCart = entries.length > 0 && entries.every((e) => cart.has(e.cartLine.item));
  const held = entries.length === 0 || checking || !!blockedReason;

  // Prices the plan as it stands and marks each line that can't be bought, or whose price changed. null when
  // the check itself failed (toasted).
  async function price(): Promise<SponsorCartQuote | null> {
    const r = await sponsorRequest<SponsorCartQuote>("POST", routes.api.sponsorCartQuote, {
      body: { items: entries.map((e) => e.cartLine.item) },
    });
    if (!r.view) {
      toast.error(r.message ?? "Couldn't check the plan's prices, please try again.");
      return null;
    }
    const notes = new Map<number, string[]>();
    for (const q of r.view.items) {
      const entry = entries[q.index];
      if (!entry) continue;
      const text = !q.isAvailable
        ? `${entry.cartLine.name}: ${q.problem ?? "can't be bought right now"}`
        : q.priceChanged && q.totalCents !== null
          ? `${entry.cartLine.name}: now ${dollars(q.totalCents)} (was ${dollars(entry.cartLine.totalCents)})`
          : null;
      if (text) notes.set(entry.lineIndex, [...(notes.get(entry.lineIndex) ?? []), text]);
    }
    onProblems(new Map([...notes].map(([line, texts]) => [line, texts.join(" · ")])));
    return r.view;
  }

  async function startBuy() {
    setPricing(true);
    const quote = await price();
    setPricing(false);
    if (!quote) return;
    const unavailable = new Set(
      quote.items.filter((q) => !q.isAvailable).map((q) => entries[q.index]?.lineIndex)
    ).size;
    if (unavailable > 0) {
      toast.error(`Remove the ${plural(unavailable, "line")} that can't be bought (✕), then buy again.`);
      return;
    }
    // A changed price is shown in the confirm and sent as the price the sponsor accepts by paying.
    const items = entries.map((e, i) => {
      const q = quote.items.find((x) => x.index === i);
      return q?.priceChanged && q.totalCents !== null ? { ...e.cartLine.item, expectedTotalCents: q.totalCents } : e.cartLine.item;
    });
    setConfirming({
      quote,
      items,
      organizationCount: new Set(entries.map((e) => e.cartLine.organization.id)).size,
      changedCount: quote.items.filter((q) => q.priceChanged).length,
    });
    // Fresh saved methods and a new idempotency key: a retry of this confirm never pays twice.
    pay.start();
  }

  // Paid or clearing: the plan is bought. Otherwise it stays, to try again.
  const finish = (outcome: CheckoutOutcome, result?: SponsorCartActivation) => {
    const bought = result?.activations.length;
    toastOutcome(outcome, bought ? `${plural(bought, "sponsorship")} activated` : "Payment received");
    if (outcome.kind !== "paid" && outcome.kind !== "processing") return false;
    onBought({ kind: outcome.kind, result, methodLabel: outcome.checkout?.methodLabel ?? null });
    return true;
  };

  const isPaid = (confirming?.quote.totalCents ?? 0) > 0;

  async function buy() {
    if (!confirming) return false;
    if (isPaid && !pay.choice) return false;
    const { items } = confirming;
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
    toast.error(r.message ?? "Couldn't buy the plan, please try again.");
    // An item that can't be bought or a changed price: nothing was charged; the confirm closes and the lines
    // show why. A declined payment (400 without item errors) keeps it open to pay another way. Either way
    // the next attempt gets a new key; anything else retries with the same one.
    if (r.status === 409 || (r.status === 400 && r.errors?.length)) {
      pay.renewKey();
      await price();
      return true;
    }
    if (r.status === 400) pay.renewKey();
    return false;
  }

  function addToCart() {
    let added = 0;
    let alreadyIn = 0;
    let refused: string | null = null;
    for (const { cartLine } of entries) {
      if (cart.has(cartLine.item)) {
        alreadyIn += 1;
        continue;
      }
      refused = cart.add(cartLine);
      if (refused) break;
      added += 1;
    }
    if (added > 0) {
      toast.success(
        `${plural(added, "item")} added to your cart${alreadyIn ? ` (${alreadyIn} already in it)` : ""}`
      );
    }
    if (refused) toast.error(refused);
  }

  return (
    <SectionCard
      title="Ready to launch"
      className="flex-[1_1_380px] min-w-0 bg-[#17151f] border border-[#4a3f7a] backdrop-blur-none gap-[14px]"
    >
      <p className="text-[15px] text-[#d4d4d4] leading-[1.55]">
        Buying charges your payment method once for the whole plan. Each organization’s package goes live as soon
        as the payment clears. Your brand assets are attached automatically.
      </p>
      <div className="flex justify-between items-baseline gap-3 border-t border-[#2c2547] pt-3">
        <span className="text-[15px] text-[#c4c4c4]">{count === 1 ? "1 package" : `${count} packages`}</span>
        <span className="font-display font-extrabold text-[40px] leading-none">{dollars(totalCents)}</span>
      </div>
      {/* mt-auto keeps the buttons at the card bottom when the inventory mix beside it is taller. */}
      <div className="flex flex-col gap-2 mt-auto">
        <div className="flex flex-wrap gap-[10px]">
          <Button
            label={pricing ? "Checking prices…" : "Buy full package"}
            onClick={startBuy}
            disabled={held || pricing}
            className={cn(PRIMARY_BUTTON, "flex-[1_1_180px] h-[52px] px-4 rounded-[12px] text-base")}
          />
          <Button
            label={allInCart ? "In your cart" : "Add to cart"}
            onClick={addToCart}
            disabled={held || allInCart}
            className={SECONDARY}
          />
          <Button label="Save draft" disabled title={COMING_SOON} className={SECONDARY} />
          <Button label="Export PDF" disabled title={COMING_SOON} className={SECONDARY} />
        </div>
        {blockedReason && <p className="text-[13px] text-[#f0c36a]">{blockedReason}</p>}
        <p className={HINT}>Saving and exporting a plan: coming soon.</p>
      </div>

      <ConfirmModal
        isOpen={!!confirming}
        onClose={() => setConfirming(null)}
        title="Buy full package"
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        message={
          !confirming
            ? ""
            : [
                confirming.changedCount > 0 &&
                  `${plural(confirming.changedCount, "price")} changed since the plan was built.`,
                isPaid
                  ? `Buy ${plural(confirming.items.length, "item")} from ${plural(confirming.organizationCount, "organization")} for ${formatCents(confirming.quote.totalCents, confirming.quote.currency)}, paid together? They go live once paid.`
                  : `Activate ${plural(confirming.items.length, "item")} from ${plural(confirming.organizationCount, "organization")}? They're free and start right away.`,
              ]
                .filter(Boolean)
                .join(" ")
        }
        confirmLabel={
          confirming && isPaid ? `Pay ${formatCents(confirming.quote.totalCents, confirming.quote.currency)}` : "Activate all"
        }
        busyLabel={isPaid ? "Paying…" : "Activating…"}
        onConfirm={buy}
        confirmDisabled={isPaid && !pay.choice}
      >
        {isPaid && <PaymentChoice checkout={pay} />}
      </ConfirmModal>
      <CheckoutPaymentModal
        checkout={pay.formCheckout}
        summary={
          paying
            ? `${plural(paying.activations.length, "item")} with ${plural(new Set(paying.activations.map((a) => a.organization.id)).size, "organization")}`
            : ""
        }
        // The plan lives only on this screen, so a redirect-based method comes back to My Sponsorships.
        returnPath={routes.ui.sponsor.mySponsorshipsPaymentReturn}
        closeLabel="Cancel payment"
        onClose={() => {
          setPaying(null);
          pay.abandonForm();
        }}
        onDone={(outcome) => {
          const result = paying ?? undefined;
          pay.closeForm();
          setPaying(null);
          finish(outcome.kind === "needs-form" ? { kind: "pending", checkout: outcome.checkout } : outcome, result);
        }}
      />
    </SectionCard>
  );
}
