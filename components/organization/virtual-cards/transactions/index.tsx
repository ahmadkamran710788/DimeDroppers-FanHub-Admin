"use client";

import { useEffect, useState } from "react";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { cn } from "@/utils/cn";
import { formatInstantDate, plural } from "@/utils/helper";
import { dollars, humanizeSlug } from "@/utils/needs";
import { routes } from "@/utils/routes";
import type { MerchantCategory, NeedActivity, OrgNeedDetail } from "@/utils/types/needs";

// How each kind of activity reads: a purchase takes money off the card, a merchant refund puts it back, a
// declined one moved nothing.
const KIND: Record<NeedActivity["kind"], { dot: string; text: string; amount: string }> = {
  CAPTURE: { dot: "bg-success", text: "text-success", amount: "" },
  REFUND: { dot: "bg-[#638BFE]", text: "text-[#8EA8FF]", amount: "text-success" },
  DECLINED: { dot: "bg-error", text: "text-error", amount: "text-white/50 line-through" },
};

function amountText(a: NeedActivity) {
  if (a.kind === "CAPTURE") return `−${dollars(a.amountCents)}`;
  if (a.kind === "REFUND") return `+${dollars(a.amountCents)}`;
  return dollars(a.amountCents);
}

function statusText(a: NeedActivity) {
  if (a.kind === "CAPTURE") return "Approved";
  if (a.kind === "REFUND") return "Refunded by merchant";
  return `Declined · ${a.declineLabel ?? "not allowed"}`;
}

interface Loaded {
  key: string;
  activity?: NeedActivity[];
  error?: string;
}

interface TransactionsProps {
  // The need the card serves now; null between needs.
  needId: string | null;
  // The card's categories, for a readable merchant category.
  allowedCategories: MerchantCategory[];
}

// The card's history for the need it serves now (GET /fanhub/org/needs/:id → activity, newest first, at most
// 100). A declined purchase is struck through with why it was declined.
export default function Transactions({ needId, allowedCategories }: TransactionsProps) {
  const [reloads, setReloads] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const key = `${needId}|${reloads}`;
  useEffect(() => {
    if (!needId) return;
    let cancelled = false;
    sponsorRequest<OrgNeedDetail>("GET", routes.api.orgNeed(needId)).then((r) => {
      if (!cancelled) setLoaded({ key, activity: r.view?.activity, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [key, needId]);

  const current = needId && loaded?.key === key ? loaded : null;
  const list = current?.activity ?? [];
  const categoryLabel = (slug: string | null) =>
    slug ? (allowedCategories.find((c) => c.stripeCategory === slug)?.label ?? humanizeSlug(slug)) : null;

  return (
    <section className="rounded-[8px] bg-surface-06 text-white backdrop-blur-[24px]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4 lg:px-6">
        <h3 className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight">Transactions</h3>
        {current?.activity && <span className="text-[13px] text-white/60">{plural(list.length, "transaction")}</span>}
      </div>
      {!needId ? (
        <p className="px-4 py-7 text-center text-sm text-white/60">Transactions show while this card serves a need.</p>
      ) : !current ? (
        <Loader className="py-7" />
      ) : current.error ? (
        <div className="flex flex-col items-center gap-3 px-4 py-7 text-center">
          <p className="text-sm text-white/60">{`Couldn't load the transactions: ${current.error}`}</p>
          <Button size="sm" variant="outline" label="Try again" onClick={() => setReloads((n) => n + 1)} className="h-9 px-3" />
        </div>
      ) : list.length === 0 ? (
        <p className="px-4 py-7 text-center text-sm text-white/60">No purchases yet on this card.</p>
      ) : (
        <ul>
          {list.map((a) => {
            const kind = KIND[a.kind] ?? KIND.CAPTURE;
            return (
              <li key={a.id} className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5 last:border-b-0 lg:px-6">
                <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", kind.dot)} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-medium break-words">{a.merchantName || "Card purchase"}</span>
                  <span className="text-xs text-white/60">
                    {[formatInstantDate(a.occurredAt), categoryLabel(a.merchantCategory)].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                  <span className={cn("font-semibold", kind.amount)}>{amountText(a)}</span>
                  <span className={cn("text-xs", kind.text)}>{statusText(a)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
