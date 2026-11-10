"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { cardBeingSetUp } from "@/components/organization/fundable-needs/data";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import { getStripe } from "@/utils/stripe";
import type { OrgCardListItem } from "@/utils/types/needs";

// How Stripe draws the revealed details inside its frames (they can't take our classes).
const ELEMENT_STYLE = {
  base: { color: "#ffffff", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "18px", letterSpacing: "2px" },
};
const SMALL_STYLE = { base: { ...ELEMENT_STYLE.base, fontSize: "12px", letterSpacing: "1px" } };

interface CardFaceProps {
  item: OrgCardListItem;
  // Printed across the top of the card.
  orgName: string;
  // Show the real number, expiry and CVC (Stripe Issuing Elements) instead of dots.
  revealed: boolean;
  // The details couldn't be shown: the page turns the reveal back off.
  onRevealFailed: () => void;
}

// The card itself: the organisation, the need it pays for now, and its details. They're masked until
// revealed, and then drawn by Stripe so the card number never passes through our backend
// (POST /:needId/card/ephemeral-key). Greyed out while it can't be used.
export default function CardFace({ item, orgName, revealed, onRevealFailed }: CardFaceProps) {
  const { card, currentNeed } = item;
  const numberRef = useRef<HTMLSpanElement>(null);
  const expiryRef = useRef<HTMLSpanElement>(null);
  const cvcRef = useRef<HTMLSpanElement>(null);
  // The details are drawn (until then the dots stay).
  const [shown, setShown] = useState(false);
  // The latest callback, without making the reveal start over each time the page re-renders.
  const onFailRef = useRef(onRevealFailed);
  useEffect(() => {
    onFailRef.current = onRevealFailed;
  });

  const needId = currentNeed?.id ?? null;
  const stripeCardId = card.stripeCardId;

  useEffect(() => {
    if (!revealed || !needId || !stripeCardId) return;
    let cancelled = false;
    const destroyers: (() => void)[] = [];
    const fail = (message: string) => {
      if (cancelled) return;
      toast.error(message);
      onFailRef.current();
    };
    (async () => {
      const stripe = await getStripe();
      if (cancelled) return;
      if (!stripe) return fail("Card details aren't available right now.");
      const nonceResult = await stripe.createEphemeralKeyNonce({ issuingCard: stripeCardId });
      if (cancelled) return;
      if ("error" in nonceResult && nonceResult.error) return fail(nonceResult.error.message ?? "Couldn't show the card details.");
      const { nonce } = nonceResult as { nonce: string };
      const r = await sponsorRequest<{ ephemeralKeySecret: string }>("POST", routes.api.orgNeedCardEphemeralKey(needId), {
        body: { nonce },
      });
      if (cancelled) return;
      if (!r.view?.ephemeralKeySecret) return fail(r.message ?? "Couldn't show the card details.");
      const base = { issuingCard: stripeCardId, nonce, ephemeralKeySecret: r.view.ephemeralKeySecret };
      const elements = stripe.elements();
      const mounts: [HTMLSpanElement | null, () => { mount: (el: HTMLElement) => void; destroy: () => void }][] = [
        [numberRef.current, () => elements.create("issuingCardNumberDisplay", { ...base, style: ELEMENT_STYLE })],
        [expiryRef.current, () => elements.create("issuingCardExpiryDisplay", { ...base, style: SMALL_STYLE })],
        [cvcRef.current, () => elements.create("issuingCardCvcDisplay", { ...base, style: SMALL_STYLE })],
      ];
      for (const [el, make] of mounts) {
        if (!el) continue;
        const element = make();
        element.mount(el);
        destroyers.push(() => element.destroy());
      }
      setShown(true);
    })();
    return () => {
      cancelled = true;
      destroyers.forEach((destroy) => destroy());
      setShown(false);
    };
  }, [revealed, needId, stripeCardId]);

  const usable = card.readyToSpend;
  const settingUp = cardBeingSetUp(card);
  const masked = !revealed || !shown;
  return (
    <div
      className={cn(
        "flex min-h-[210px] max-w-[400px] flex-[1_1_320px] flex-col justify-between gap-3 rounded-[16px] p-[22px] text-white",
        !usable && "bg-white/15 opacity-80"
      )}
      style={usable ? { background: "var(--gradient-cta)" } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[1.5px] opacity-90">{orgName}</span>
        <span className="shrink-0 rounded-full border border-white/60 px-2 py-0.5 text-[11px] font-bold tracking-[1px]">VIRTUAL</span>
      </div>
      <span className="text-sm font-medium">{currentNeed?.title ?? `Waiting for your next ${item.category.name} need`}</span>
      {settingUp ? (
        <span className="text-base font-semibold">Card being set up</span>
      ) : (
        <span className="font-mono text-lg sm:text-xl tracking-[2px]">
          {masked && (
            <>
              <span aria-hidden="true">{`•••• •••• •••• ${card.last4 ?? "••••"}`}</span>
              <span className="sr-only">{card.last4 ? `Card ending in ${card.last4}` : "Card number hidden"}</span>
            </>
          )}
          {/* Stripe draws the real number in here when revealed (an empty span until then: a hidden
              mount may never draw). */}
          <span ref={numberRef} className="block" />
        </span>
      )}
      <div className="flex items-end justify-between text-xs">
        <span className="flex items-center gap-[18px]">
          <span className="flex items-center gap-1">
            EXP {masked && "••/••"}
            <span ref={expiryRef} className={cn("inline-block", !masked && "min-w-[44px]")} />
          </span>
          <span className="flex items-center gap-1">
            CVC {masked && "•••"}
            <span ref={cvcRef} className={cn("inline-block", !masked && "min-w-[32px]")} />
          </span>
        </span>
        <span className="text-base font-bold italic tracking-[0.5px]">VISA</span>
      </div>
    </div>
  );
}
