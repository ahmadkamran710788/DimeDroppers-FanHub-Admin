"use client";

import Link from "next/link";
import { cn } from "@/utils/cn";
import Checkbox from "@/components/common/checkbox";
import Loader from "@/components/common/loader";
import { methodDetail, methodProblem } from "@/components/sponsor/payment-methods/data";
import type { Checkout } from "@/components/sponsor/checkout/use-checkout";
import { routes } from "@/utils/routes";

const ROW = "w-full flex items-start gap-3 rounded-[12px] border px-3.5 py-3 text-left transition-colors";

// A radio dot for a method row.
function Dot({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "mt-0.5 size-[18px] shrink-0 rounded-full border-2 flex items-center justify-center",
        on ? "border-[#6a4be6]" : "border-midnight-navy/30"
      )}
    >
      {on && <span className="size-2 rounded-full bg-[#6a4be6]" />}
    </span>
  );
}

interface PaymentChoiceProps {
  checkout: Checkout;
}

// "How to pay" inside a white checkout popup: the saved methods (defaults first; ones that can't pay are
// greyed with the reason), or a new method in Stripe's form, kept for next time unless unticked.
export default function PaymentChoice({ checkout }: PaymentChoiceProps) {
  const { methods, methodsError, methodsErrorStatus, methodsLoading, canUseNew, choice, pick } = checkout;
  const isNew = !!choice && !choice.paymentMethodId;

  return (
    <div className="w-full flex flex-col gap-2 text-midnight-navy">
      <div className="text-[13px] font-semibold tracking-[1px] text-midnight-navy/60">HOW TO PAY</div>
      {methodsLoading && !methods ? (
        <Loader />
      ) : methodsError ? (
        <p className="text-sm text-red-600">
          {methodsError}{" "}
          {methodsErrorStatus === 409 && (
            <Link href={routes.ui.sponsor.profile} className="underline font-semibold">
              Open Sponsor Profile
            </Link>
          )}
        </p>
      ) : (
        <div role="radiogroup" aria-label="How to pay" className="flex flex-col gap-2">
          {methods?.map((m) => {
            const problem = methodProblem(m);
            const on = choice?.paymentMethodId === m.id;
            return (
              // A whole clickable row (picks this method), not an action button.
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={!!problem}
                onClick={() => pick({ paymentMethodId: m.id })}
                className={cn(
                  ROW,
                  on ? "border-[#6a4be6] bg-[#6a4be6]/5" : "border-midnight-navy/15 hover:bg-midnight-navy/5",
                  problem && "opacity-50 cursor-not-allowed hover:bg-transparent"
                )}
              >
                <Dot on={on} />
                <span className="min-w-0 flex-1 flex flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold break-words">{m.label}</span>
                    {m.isDefault && (
                      <span className="text-[10px] font-bold tracking-[1px] uppercase px-1.5 py-0.5 rounded-full bg-[#6a4be6]/10 text-[#6a4be6]">
                        Default
                      </span>
                    )}
                  </span>
                  <span className="text-[13px] text-midnight-navy/60 break-words">
                    {problem ?? `${m.typeLabel} · ${methodDetail(m)}`}
                  </span>
                </span>
              </button>
            );
          })}
          {canUseNew && (
            <div
              className={cn(
                "rounded-[12px] border",
                isNew ? "border-[#6a4be6] bg-[#6a4be6]/5" : "border-midnight-navy/15"
              )}
            >
              {/* A whole clickable row (pays with a new method), not an action button. */}
              <button
                type="button"
                role="radio"
                aria-checked={isNew}
                onClick={() => pick({ savePaymentMethod: choice?.savePaymentMethod ?? true })}
                className={cn(ROW, "border-transparent", !isNew && "hover:bg-midnight-navy/5")}
              >
                <Dot on={isNew} />
                <span className="min-w-0 flex-1 flex flex-col gap-0.5">
                  <span className="text-[15px] font-semibold">Pay with a new method</span>
                  <span className="text-[13px] text-midnight-navy/60">
                    Card, bank account, Cash App Pay or Link, in Stripe&apos;s secure form next
                  </span>
                </span>
              </button>
              {isNew && (
                // The tick's clickable label, not an action button.
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={choice.savePaymentMethod !== false}
                  onClick={() => pick({ savePaymentMethod: choice.savePaymentMethod === false })}
                  className="flex items-center gap-2 px-[44px] pb-3 text-sm text-midnight-navy/80"
                >
                  <Checkbox checked={choice.savePaymentMethod !== false} variant="violet" />
                  Save it for next time
                </button>
              )}
            </div>
          )}
          {!methods?.length && !canUseNew && (
            <p className="text-sm text-red-600">Payments aren&apos;t available right now. Please try again later.</p>
          )}
        </div>
      )}
      <Link href={routes.ui.sponsor.paymentMethods} className="self-start text-sm font-semibold text-[#6a4be6] underline">
        Manage payment methods
      </Link>
    </div>
  );
}
