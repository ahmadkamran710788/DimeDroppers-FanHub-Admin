import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { plural } from "@/utils/helper";
import { CARD } from "@/components/sponsor/styles";
import { BANK_CLEARING_TEXT } from "@/components/sponsor/payment-methods/data";
import { formatCents } from "@/components/sponsor/sponsor-api";
import type { SponsorCartActivation } from "@/utils/types/sponsor-packages";

// A batch checkout that went through: live now ("paid") or a bank payment clearing ("processing"). The
// activations are known after the buy, not after coming back from Stripe.
export interface ActivatedDone {
  kind: "paid" | "processing";
  result?: SponsorCartActivation;
  methodLabel: string | null;
}

interface ActivatedSummaryProps {
  done: ActivatedDone;
  // The ways on from here (links or buttons), under the list.
  actions: ReactNode;
}

// After the cart's Activate all or the Campaign Planner's Buy full package: what was bought and how it was paid.
export default function ActivatedSummary({ done, actions }: ActivatedSummaryProps) {
  const { result, kind, methodLabel } = done;
  const clearing = kind === "processing";
  const summary = result
    ? `${plural(result.activations.length, "sponsorship")} ${clearing ? "bought" : "started"} for ${formatCents(result.totalCents, result.currency)}${methodLabel ? `, paid with ${methodLabel}` : ""}.`
    : `Your payment went through${methodLabel ? ` with ${methodLabel}` : ""}.`;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          {clearing ? "PAYMENT ON ITS WAY" : "ACTIVATED"}
        </h2>
        <p className="text-base leading-[26px] text-[#e5e5e5]">{summary}</p>
        {clearing && <p className="text-base leading-[26px] text-[#f0c36a]">{BANK_CLEARING_TEXT}</p>}
      </div>
      <section aria-label="Activated sponsorships" className={cn(CARD, "rounded-[8px] p-4 lg:p-[26px] flex flex-col gap-3")}>
        {!result && (
          <p className="text-[15px] text-[#a8a8a8]">Your sponsorships and their status are in My Sponsorships.</p>
        )}
        <ul className="flex flex-col gap-2">
          {result?.activations.map((a) => (
            <li
              key={a.id}
              className="rounded-[12px] border border-[#262626] bg-[#0b0b0b] p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold break-words">{a.packageName}</span>
                <span className="block text-[13px] text-[#a8a8a8] break-words">
                  {[a.organization.name ?? "Unnamed organization", a.event?.name].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="text-[15px] font-bold whitespace-nowrap">{formatCents(a.totalCents, a.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">{actions}</div>
      </section>
    </div>
  );
}
