"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import Loader from "@/components/common/loader";
import Pagination from "@/components/common/pagination";
import Tabs from "@/components/common/tabs";
import { CARD, OUTLINE_BUTTON, PRIMARY_BUTTON } from "@/components/sponsor/styles";
import CancelModal from "@/components/sponsor/my-sponsorships/cancel-modal";
import SponsorshipRow from "@/components/sponsor/my-sponsorships/sponsorship-row";
import CheckoutPaymentModal from "@/components/sponsor/checkout/checkout-payment-modal";
import {
  cancelCheckout,
  fetchCheckout,
  settleCheckout,
  toastOutcome,
  type CheckoutOutcome,
} from "@/components/sponsor/checkout/settle-checkout";
import { usePaymentReturn } from "@/components/sponsor/checkout/use-payment-return";
import type { ReturnedPayment } from "@/components/sponsor/checkout/returned-payment";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { routes } from "@/utils/routes";
import type { PackageActivation, PackageActivationsPage, PackageActivationStatus } from "@/utils/types/sponsor-packages";
import type { SponsorCheckout } from "@/utils/types/sponsor-payments";

const PAGE_SIZE = 10;
const TABS = ["Active", "Awaiting payment", "Expired", "Cancelled", "All"] as const;
type Tab = (typeof TABS)[number];
const TAB_STATUS: Record<Tab, PackageActivationStatus | undefined> = {
  Active: "ACTIVE",
  "Awaiting payment": "PENDING_PAYMENT",
  Expired: "EXPIRED",
  Cancelled: "CANCELLED",
  All: undefined,
};
const EMPTY_TEXT: Record<Tab, string> = {
  Active: "You have no active sponsorships.",
  "Awaiting payment": "Nothing is waiting for a payment.",
  Expired: "None of your sponsorships has ended yet.",
  Cancelled: "You haven't cancelled any sponsorship.",
  All: "You haven't activated any sponsorship yet.",
};

const PAID_TEXT = "Payment received. Your sponsorship is live.";

interface MySponsorshipsProps {
  // From ?payment=&payment_intent= (Stripe's return_url after a redirect-based method, from Activate).
  returnedPayment?: ReturnedPayment;
}

const LINK_BUTTON = "inline-flex items-center justify-center h-12 px-[22px] rounded-[10px] text-[15px]";

interface Loaded {
  key: string;
  page?: PackageActivationsPage;
  error?: string;
}

// The sponsor's own activations (GET /fanhub/sponsor-packages/activations), newest first, by status, with
// how each was paid. One never charged can be cancelled here; one whose payment still waits can have that
// payment finished or cancelled.
export default function MySponsorships({ returnedPayment }: MySponsorshipsProps) {
  const [tab, setTab] = useState<Tab>("Active");
  const [page, setPage] = useState(1);
  // Bumped to load the list again (Retry, or after a cancel or a payment).
  const [reloads, setReloads] = useState(0);
  const [list, setList] = useState<Loaded | null>(null);
  const [cancelling, setCancelling] = useState<PackageActivation | null>(null);
  // The payment Stripe's form is open for (Finish payment on a new method); null when closed.
  const [finishing, setFinishing] = useState<SponsorCheckout | null>(null);
  // The waiting payment whose Cancel payment confirm is open.
  const [cancellingPayment, setCancellingPayment] = useState<string | null>(null);

  const reload = () => setReloads((n) => n + 1);

  const settled = (outcome: CheckoutOutcome) => {
    toastOutcome(outcome, PAID_TEXT);
    reload();
  };

  usePaymentReturn(returnedPayment, routes.ui.sponsor.mySponsorships, settled);

  // Finish payment: Stripe's check for a saved method, or Stripe's form for a new one.
  const finishPayment = async (paymentId: string) => {
    const checkout = await fetchCheckout(paymentId);
    if (!checkout) return;
    const outcome = await settleCheckout(checkout);
    if (outcome.kind === "needs-form") setFinishing(outcome.checkout);
    else settled(outcome);
  };

  const cancelPayment = async () => {
    if (!cancellingPayment) return false;
    const r = await cancelCheckout(cancellingPayment);
    if (r.ok) toast.success("Payment cancelled. Nothing was charged.");
    else toast.error(r.message ?? "Couldn't cancel the payment, please try again.");
    // 409: it isn't waiting any more (it may just have been paid); the list shows it as it is now.
    if (r.ok || r.status === 409 || r.status === 404) {
      reload();
      return true;
    }
    return false;
  };

  const key = `${tab}|${page}|${reloads}`;
  useEffect(() => {
    let cancelled = false;
    sponsorRequest<PackageActivationsPage>("GET", routes.api.sponsorActivations, {
      params: { status: TAB_STATUS[tab], page, limit: PAGE_SIZE },
    }).then((r) => {
      if (!cancelled) setList({ key, page: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [key, tab, page]);

  const current = list?.key === key ? list : null;
  const items = current?.page?.items ?? [];
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = from + items.length - 1;

  // A cancelled one leaves the Active tab: step back when it was the last on its page.
  const afterCancel = () => {
    if (tab === "Active" && items.length === 1 && page > 1) setPage((p) => p - 1);
    else setReloads((n) => n + 1);
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          MY SPONSORSHIPS
        </h2>
        <p className="text-base leading-[26px] text-[#e5e5e5]">
          Every package and physical asset you&apos;ve activated, and how it was paid. Finish or cancel a payment that
          is still waiting here.
        </p>
      </div>

      <section aria-label="Sponsorships" className="flex flex-col gap-4">
        <Tabs
          tabs={TABS}
          active={tab}
          onChange={(t) => {
            setTab(t);
            setPage(1);
          }}
        />

        {!current ? (
          <Loader />
        ) : current.error ? (
          <div className={cn(CARD, "rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3")}>
            <p className="text-sm text-[#f0c36a]">{`Couldn't load your sponsorships: ${current.error}`}</p>
            <Button
              label="Retry"
              onClick={() => setReloads((n) => n + 1)}
              className={cn(OUTLINE_BUTTON, "h-10 px-4 rounded-[10px] text-sm")}
            />
          </div>
        ) : items.length === 0 ? (
          <div className={cn(CARD, "rounded-[8px] p-6 flex flex-col items-start gap-4")}>
            <p className="text-[15px] text-[#a8a8a8]">{EMPTY_TEXT[tab]}</p>
            {(tab === "Active" || tab === "All") && (
              <Link href={routes.ui.sponsor.findOrganizations} className={cn(PRIMARY_BUTTON, LINK_BUTTON)}>
                Find sponsorships
              </Link>
            )}
          </div>
        ) : (
          <>
            {items.map((a) => (
              <SponsorshipRow
                key={a.id}
                activation={a}
                onCancel={() => setCancelling(a)}
                onFinishPayment={finishPayment}
                onCancelPayment={setCancellingPayment}
              />
            ))}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
              <span className="text-xs text-white/80">
                {`Showing ${from} to ${to} of ${current.page?.pagination.total ?? 0} sponsorships`}
              </span>
              <Pagination page={page} pageCount={current.page?.pagination.totalPages ?? 0} onChange={setPage} />
            </div>
          </>
        )}
      </section>

      <CancelModal target={cancelling} onClose={() => setCancelling(null)} onDone={afterCancel} />
      <ConfirmModal
        isOpen={!!cancellingPayment}
        onClose={() => setCancellingPayment(null)}
        title="Cancel payment"
        message="Cancel this payment? Nothing is charged, and every sponsorship ordered with it (the whole cart, for a cart) is cancelled and its stores freed."
        confirmLabel="Cancel payment"
        busyLabel="Cancelling…"
        cancelLabel="Keep it"
        destructive
        onConfirm={cancelPayment}
      />
      <CheckoutPaymentModal
        checkout={finishing}
        summary={finishing?.orderIds.length === 1 ? "1 sponsorship" : `${finishing?.orderIds.length ?? 0} sponsorships`}
        returnPath={routes.ui.sponsor.mySponsorshipsPaymentReturn}
        closeLabel="Close"
        onClose={() => setFinishing(null)}
        onDone={(outcome) => {
          setFinishing(null);
          settled(outcome.kind === "needs-form" ? { kind: "pending", checkout: outcome.checkout } : outcome);
        }}
      />
    </div>
  );
}
