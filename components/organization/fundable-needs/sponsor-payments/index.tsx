"use client";

import { useEffect, useState } from "react";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import OrgMonogram from "@/components/sponsor/find-organizations/org-monogram";
import { BRAND_DISPLAY_LABEL, CONTRIBUTION_STATUS } from "@/components/organization/fundable-needs/data";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { cn } from "@/utils/cn";
import { formatInstantDate } from "@/utils/helper";
import { dollars } from "@/utils/needs";
import { routes } from "@/utils/routes";
import type { OrgNeedDetail } from "@/utils/types/needs";

interface Loaded {
  key: string;
  view?: OrgNeedDetail;
  error?: string;
}

// Every sponsor payment for one need (GET /fanhub/org/needs/:id → contributions): who paid, how much, how
// it's going, how much of it has been used, how they want their brand shown, and their note to you.
export default function SponsorPayments({ needId }: { needId: string }) {
  const [reloads, setReloads] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const key = `${needId}|${reloads}`;
  useEffect(() => {
    let cancelled = false;
    sponsorRequest<OrgNeedDetail>("GET", routes.api.orgNeed(needId)).then((r) => {
      if (!cancelled) setLoaded({ key, view: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [key, needId]);

  const current = loaded?.key === key ? loaded : null;
  if (!current) return <Loader className="py-4" />;
  if (current.error)
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
        {`Couldn't load the payments: ${current.error}`}
        <Button size="sm" variant="outline" label="Try again" onClick={() => setReloads((n) => n + 1)} className="h-9 px-3" />
      </div>
    );

  const payments = current.view?.contributions ?? [];
  if (payments.length === 0) return <p className="text-sm text-white/60">No sponsor payments yet.</p>;

  return (
    <ul className="flex flex-col gap-2">
      {payments.map((p) => {
        const status = CONTRIBUTION_STATUS[p.status];
        const paid = p.status === "PAID";
        return (
          <li key={p.id} className="flex flex-wrap items-start gap-3 rounded-[8px] border border-white/10 bg-black/30 p-3.5">
            <OrgMonogram logoUrl={p.sponsor.logoUrl} size="sm" />
            <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold">{p.sponsor.name ?? "A sponsor"}</span>
                <span className={cn("text-xs font-semibold", status.color)}>{status.label}</span>
              </span>
              <span className="text-xs text-white/60">
                {[formatInstantDate(p.paidAt ?? p.createdAt), `Brand shown as: ${BRAND_DISPLAY_LABEL[p.brandDisplay]}`].join(" · ")}
              </span>
              {p.status === "FAILED" && p.failureReason && <span className="text-xs text-error">{p.failureReason}</span>}
              {p.note && (
                <p className="mt-1 rounded-[6px] bg-white/5 px-3 py-2 text-sm italic leading-[1.5] text-white/85 break-words">
                  {`“${p.note}”`}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
              <span className={cn("text-lg font-bold", !paid && "text-white/60")}>{dollars(p.amountCents)}</span>
              {paid && (
                <span className="text-xs text-white/60">
                  {`used ${dollars(p.utilizedCents)} · left ${dollars(p.remainingCents)}${p.refundedCents ? ` · refunded ${dollars(p.refundedCents)}` : ""}`}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
