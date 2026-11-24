"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import ConfirmModal from "@/components/common/confirm-modal";
import Loader from "@/components/common/loader";
import { CARD } from "@/components/sponsor/styles";
import OrgMonogram from "@/components/sponsor/find-organizations/org-monogram";
import GamesBreakdown, { basisCount, priceBasisText } from "@/components/sponsor/find-organizations/games-breakdown";
import PackageCard from "@/components/sponsor/find-organizations/package-card";
import PhysicalAddOns from "@/components/sponsor/find-organizations/physical-add-ons";
import StoreChecklist from "@/components/sponsor/store-checklist";
import CheckoutPaymentModal from "@/components/sponsor/checkout/checkout-payment-modal";
import PaymentChoice from "@/components/sponsor/checkout/payment-choice";
import { toastOutcome, type CheckoutOutcome } from "@/components/sponsor/checkout/settle-checkout";
import { useCheckout } from "@/components/sponsor/checkout/use-checkout";
import { fmtEventDate } from "@/components/sponsor/find-organizations/data";
import {
  activeActivations,
  formatCents,
  sponsorRequest,
  type ActiveActivations,
} from "@/components/sponsor/sponsor-api";
import { NO_OWN_GAMES, cartSplitOf, partLabel } from "@/components/sponsor/package-splits/data";
import { cartItemKey, holdingKey, useSponsorCart } from "@/context/sponsor-cart";
import { routes } from "@/utils/routes";
import type {
  ActivatePackageRequest,
  CartSplit,
  NearStores,
  PackageActivationResult,
  PackageSplit,
  PackageTier,
  SponsorCartKind,
  SponsorEventOption,
  SponsorNearLocation,
  SponsorOrganizationListItem,
  SponsorPackage,
  SponsorPackages,
} from "@/utils/types/sponsor-packages";

// A package (with the part of it, by its key) or a physical asset, never both.
type Choice = Pick<ActivatePackageRequest, "tier" | "splitKey" | "physicalAssetId">;

// A 409 because a store already has this package part or asset here (another tab, or a cart activation): the API
// names the store(s). Any other 409 is the part taken by another sponsor meanwhile, changed (its games did), one the
// sponsor already has, or a price change: all reload (the card then shows Sold, Active, the new parts or the new
// price) and close.
const STORE_TAKEN = /already has this package or physical asset active here/i;

const NO_STORES: NearStores = { nearLocations: [], nearLocationCount: 0 };

// What the sponsor is about to activate (its payment and idempotency key are in useCheckout).
interface Pending {
  label: string;
  totalCents: number;
  currency: string;
  choice: Choice;
  // The stores near it, which ones already had it when the confirm opened, and the ones ticked.
  stores: SponsorNearLocation[];
  taken: Set<string>;
  picked: string[];
  // Near stores the API didn't list (it lists the nearest 10).
  moreStores: number;
}

// An activation whose new payment method is being entered in Stripe's form.
interface Paying {
  name: string;
  body: ActivatePackageRequest;
}

interface PackagesPanelProps {
  org: SponsorOrganizationListItem;
  // A tournament's event picked in the list under its card; undefined while its events load, or when none
  // can be sponsored.
  event?: SponsorEventOption;
  // The tournament's events are still loading.
  eventsLoading?: boolean;
  // The search's sponsor budget in cents: only the packages within it are listed (physical assets aren't
  // counted against it); undefined for any price.
  budgetCents?: number;
  // The radius the search used, sent with the stores an activation is for; null without stores.
  radiusMiles: number | null;
  // After an activation, so the results can refresh their counts.
  onActivated?: () => void;
}

// The selected organization's packages and physical assets, priced for it (teams) or for one of its
// events (games). A tournament's event is picked in the list under its card. Each one is activated on its
// own or added to the cart to activate with others, for the brand's stores near it (ticked in the confirm).
// It is paid in the confirm (a saved method, or a new one in Stripe's form) and goes live once paid.
export default function PackagesPanel({
  org,
  event,
  eventsLoading,
  budgetCents,
  radiusMiles,
  onActivated,
}: PackagesPanelProps) {
  const isTournament = org.organizationType === "TOURNAMENT";
  const cart = useSponsorCart();
  const eventId = isTournament ? (event?.id ?? "") : "";
  const [loaded, setLoaded] = useState<{ key: string; view?: SponsorPackages; error?: string } | null>(null);
  // Bumped to refetch the packages (after a 409 or an activation).
  const [reloads, setReloads] = useState(0);
  const [pending, setPending] = useState<Pending | null>(null);
  const pay = useCheckout();
  const [paying, setPaying] = useState<Paying | null>(null);
  // What the sponsor already has active here (cart item key → its stores).
  // What the sponsor already has here: active, and still being paid (which holds a package too).
  const [activeLoaded, setActiveLoaded] = useState<{
    key: string;
    active: ActiveActivations;
    pending: ActiveActivations;
  } | null>(null);

  const packagesKey = isTournament
    ? eventId
      ? `${org.id}|${eventId}|${budgetCents}|${reloads}`
      : ""
    : `${org.id}|${budgetCents}|${reloads}`;

  useEffect(() => {
    if (!packagesKey) return;
    let cancelled = false;
    sponsorRequest<SponsorPackages>("GET", routes.api.sponsorOrgPackages(org.id), {
      params: { eventId: isTournament ? eventId : undefined, budgetCents },
    }).then((r) => {
      if (!cancelled) setLoaded({ key: packagesKey, view: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [packagesKey, org.id, isTournament, eventId, budgetCents]);

  const packages = loaded?.key === packagesKey ? loaded : null;
  const view = packages?.view;

  const activeKey = `${org.id}|${reloads}`;
  useEffect(() => {
    let cancelled = false;
    Promise.all([activeActivations(org.id), activeActivations(org.id, "PENDING_PAYMENT")]).then(([active, pending]) => {
      // If it can't be checked, the sponsor isn't blocked.
      if (!cancelled) setActiveLoaded({ key: activeKey, active: active ?? new Map(), pending: pending ?? new Map() });
    });
    return () => {
      cancelled = true;
    };
  }, [activeKey, org.id]);

  const activeMap = activeLoaded?.key === activeKey ? activeLoaded.active : null;
  const pendingMap = activeLoaded?.key === activeKey ? activeLoaded.pending : null;

  // The brand's stores near what is being activated: near the organization, or near the picked event of a
  // tournament (its nearest venue). None without a search near stores.
  const near: NearStores = radiusMiles === null ? NO_STORES : isTournament ? (event ?? NO_STORES) : org;
  const nearStores = near.nearLocations;

  // The body of one activation (alone or as a cart item): this organization, the event for a
  // tournament, the package or physical asset, at the price shown, for the stores given (with the radius
  // they were found within).
  const target = (choice: Choice, totalCents: number, storeIds: string[] = []): ActivatePackageRequest => ({
    schoolId: org.id,
    ...(isTournament && { eventId }),
    ...choice,
    expectedTotalCents: totalCents,
    ...(storeIds.length > 0 && radiusMiles !== null && { sponsorLocationIds: storeIds, radiusMiles }),
  });

  // The stores a physical asset is already active for here; undefined when it isn't active. A package part is new
  // (the sponsor's own parts can't be bought again), so none of its stores have it.
  const takenFor = (choice: Choice) =>
    choice.physicalAssetId ? activeMap?.get(holdingKey(target(choice, 0)))?.stores : undefined;

  // Active: one disabled "Active". A physical asset gives each sponsor one spot, with the stores picked in that one
  // activation, so it isn't bought again here, not even for more stores.
  const isActive = (choice: Choice) => !!takenFor(choice);

  // The sponsor's own activation of it is still being paid: it holds the spot already.
  const isPending = (choice: Choice) => !!pendingMap?.has(holdingKey(target(choice, 0)));

  // The games of the sponsor's own parts of a package here, active and being paid: the card marks those parts.
  const ownOf = (tier: PackageTier) => {
    const key = holdingKey(target({ tier }, 0));
    return {
      active: activeMap?.get(key)?.games ?? NO_OWN_GAMES,
      pending: pendingMap?.get(key)?.games ?? NO_OWN_GAMES,
    };
  };

  // A package's part as an activation choice, its name and price.
  const partChoice = (p: SponsorPackage, split: PackageSplit | null) => {
    const part = split ? partLabel(split.number, p.splits.length) : "";
    return {
      choice: { tier: p.tier, ...(split?.splitKey && { splitKey: split.splitKey }) },
      name: p.name,
      // "the Community Partner package (part 2 of 3)", for the confirm.
      label: `the ${p.name} package${part ? ` (${part.toLowerCase()})` : ""}`,
      totalCents: split?.totalCents ?? p.totalCents,
      split: split ? cartSplitOf(p, split) : undefined,
    };
  };

  // The near stores that don't have it yet.
  const freeStores = (choice: Choice) => {
    const taken = takenFor(choice);
    return nearStores.filter((s) => !taken?.has(s.id));
  };

  const ask = (label: string, totalCents: number, currency: string, choice: Choice) => {
    const taken = takenFor(choice) ?? new Set<string>();
    setPending({
      label,
      totalCents,
      currency,
      choice,
      stores: nearStores,
      taken,
      picked: freeStores(choice).map((s) => s.id),
      moreStores: near.nearLocationCount - nearStores.length,
    });
    // Fresh saved methods and a new idempotency key: a retry of the same click never pays twice.
    pay.start();
  };

  // The stores the open confirm is for: once the active list is reloaded (after a 409), a store that got
  // the package meanwhile is shown as taken and left out.
  const pendingTaken = pending ? (takenFor(pending.choice) ?? pending.taken) : new Set<string>();
  const pendingPicked = pending ? pending.picked.filter((id) => !pendingTaken.has(id)) : [];
  // Near stores to choose from: an activation is then for at least one of them, never for none.
  const pendingHasStores = !!pending && pending.stores.length > 0 && radiusMiles !== null;
  const needsStore = pendingHasStores && pendingPicked.length === 0;

  const addToCart = (
    kind: SponsorCartKind,
    name: string,
    totalCents: number,
    currency: string,
    choice: Choice,
    split?: CartSplit
  ) => {
    // Every near store that doesn't have it yet; the cart can untick some before checkout.
    const stores = freeStores(choice);
    const error = cart.add({
      item: target(choice, totalCents, stores.map((s) => s.id)),
      kind,
      name,
      organization: { id: org.id, name: org.name, logoUrl: org.logoUrl },
      event: view?.event ? { id: view.event.id, name: view.event.name } : null,
      totalCents,
      currency,
      ...(stores.length > 0 && radiusMiles !== null && { stores: { near: stores, radiusMiles } }),
      ...(split && { split }),
    });
    if (error) toast.error(error);
    else toast.success(`${name} added to your cart`);
  };

  // A $0 activation is live at once, with nothing to pay.
  const pendingIsPaid = !!pending && pending.totalCents > 0;

  // How the payment ended (not Stripe's form): tells the sponsor, and once it is live or clearing, takes its
  // copy out of the cart (it would be activated a second time) and refreshes what's active. false keeps the
  // confirm open, to pay another way.
  const finish = (outcome: CheckoutOutcome, name: string, body: ActivatePackageRequest) => {
    toastOutcome(outcome, `${name} activated for ${org.name ?? "the organization"}`);
    if (outcome.kind === "failed") return false;
    if (outcome.kind === "paid" || outcome.kind === "processing") cart.remove(cartItemKey(body));
    setReloads((n) => n + 1);
    onActivated?.();
    return true;
  };

  const activate = async () => {
    if (!pending || needsStore) return false;
    if (pendingIsPaid && !pay.choice) return false;
    const body = target(pending.choice, pending.totalCents, pendingPicked);
    const r = await sponsorRequest<PackageActivationResult>("POST", routes.api.sponsorActivations, {
      body: pendingIsPaid ? { ...body, ...pay.choice } : body,
      headers: { "Idempotency-Key": pay.key },
    });
    if (r.view) {
      const outcome = await pay.settle(r.view.checkout);
      if (outcome.kind === "needs-form") {
        // The confirm closes; Stripe's form opens for the new method.
        setPaying({ name: r.view.packageName, body });
        return true;
      }
      return finish(outcome, r.view.packageName, body);
    }
    toast.error(r.message ?? "Couldn't activate, please try again.");
    // A declined payment (Stripe's own sentence) or a method that can't pay: nothing was charged, and the
    // confirm stays open to pay another way, with a new key (the same one would answer this failure again).
    if (r.status === 400) {
      pay.renewKey();
      return false;
    }
    if (r.status !== 409) return false;
    // A store that got it meanwhile: reload what's active, and keep the confirm open with that store taken.
    // Any other 409 (the package taken, the asset's spots full or one taken at the same moment, one the sponsor
    // already has, or a price change): reload and close, so the card shows why before asking again.
    setReloads((n) => n + 1);
    return !STORE_TAKEN.test(r.message ?? "");
  };

  return (
    <section
      aria-label="Packages"
      className={cn(CARD, "flex-[1.3_1_460px] min-w-0 rounded-[8px] p-4 lg:p-[26px] flex flex-col gap-[18px]")}
    >
      <div className="flex items-center gap-[14px]">
        <OrgMonogram logoUrl={org.logoUrl} size="md" />
        <div className="min-w-0">
          <div className="text-[13px] tracking-[1px] text-[#a8a8a8] font-semibold">SPONSORSHIP PACKAGES</div>
          <h3 className="font-display font-extrabold text-2xl lg:text-[30px] uppercase leading-[1.05] break-words">
            {org.name ?? "Unnamed organization"}
          </h3>
          {/* The tournament event the packages are priced for, picked in the list under its card. */}
          {isTournament && event && (
            <p className="mt-1 text-sm text-[#c9b8ff] break-words">
              {[
                event.name?.trim() || "Untitled event",
                fmtEventDate(event.startDate),
                [event.city, event.state].filter(Boolean).join(", "),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      </div>

      {isTournament && !eventId ? (
        eventsLoading ? (
          <Loader />
        ) : (
          <p className="text-sm text-[#a8a8a8]">None of this tournament&apos;s events can be sponsored yet.</p>
        )
      ) : !packages || !activeMap ? (
        <Loader />
      ) : !view ? (
        <p className="text-sm text-[#a8a8a8]">{packages.error ?? "Packages are not available yet."}</p>
      ) : (
        <>
          <p className="text-[13px] text-[#a8a8a8]">{priceBasisText(view.priceBasis)}</p>
          <GamesBreakdown priceBasis={view.priceBasis} />
          {view.packages.length === 0 ? (
            <p className="text-sm text-[#a8a8a8]">
              {budgetCents ? "No packages within your sponsor budget." : "Packages are not available yet."}
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] gap-3">
              {view.packages.map((p) => (
                <PackageCard
                  // Keyed by its parts too: new parts (a changed max, games added) start on the first open one.
                  key={`${p.tier}|${(p.splits ?? []).map((s) => s.splitKey ?? "-").join(",")}`}
                  pkg={p}
                  onActivate={(split) => {
                    const part = partChoice(p, split);
                    ask(part.label, part.totalCents, p.currency, part.choice);
                  }}
                  onAddToCart={(split) => {
                    const part = partChoice(p, split);
                    addToCart("PACKAGE", part.name, part.totalCents, p.currency, part.choice, part.split);
                  }}
                  isInCart={(splitKey) => cart.has(target({ tier: p.tier, ...(splitKey && { splitKey }) }, 0))}
                  own={ownOf(p.tier)}
                  basisCount={basisCount(view.priceBasis)}
                />
              ))}
            </div>
          )}
          <PhysicalAddOns
            orgName={org.name ?? "Organization"}
            physicalAssets={view.physicalAssets}
            onActivate={(x) => ask(x.name, x.totalCents, x.currency, { physicalAssetId: x.activationId })}
            onAddToCart={(x) =>
              addToCart("PHYSICAL_ASSET", x.name, x.totalCents, x.currency, { physicalAssetId: x.activationId })
            }
            isInCart={(x) => cart.has(target({ physicalAssetId: x.activationId }, x.totalCents))}
            isActive={(x) => isActive({ physicalAssetId: x.activationId })}
            isPending={(x) => isPending({ physicalAssetId: x.activationId })}
          />
        </>
      )}

      <ConfirmModal
        isOpen={!!pending}
        onClose={() => setPending(null)}
        title="Activate"
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        message={
          !pending
            ? ""
            : pendingIsPaid
              ? `Activate ${pending.label} with ${org.name ?? "this organization"} for ${formatCents(pending.totalCents, pending.currency)}? It goes live once paid.`
              : `Activate ${pending.label} with ${org.name ?? "this organization"}? It's free and starts right away.`
        }
        confirmLabel={pending && pendingIsPaid ? `Pay ${formatCents(pending.totalCents, pending.currency)}` : "Activate"}
        busyLabel={pendingIsPaid ? "Paying…" : "Activating…"}
        onConfirm={activate}
        confirmDisabled={needsStore || (pendingIsPaid && !pay.choice)}
      >
        {pending && pendingHasStores && radiusMiles !== null && (
          <StoreChecklist
            tone="light"
            stores={pending.stores}
            picked={pendingPicked}
            taken={pendingTaken}
            radiusMiles={radiusMiles}
            moreCount={pending.moreStores}
            onChange={(picked) => setPending((prev) => prev && { ...prev, picked })}
          />
        )}
        {pendingIsPaid && <PaymentChoice checkout={pay} />}
      </ConfirmModal>

      <CheckoutPaymentModal
        checkout={pay.formCheckout}
        summary={paying ? `${paying.name} with ${org.name ?? "this organization"}` : ""}
        returnPath={routes.ui.sponsor.mySponsorshipsPaymentReturn}
        closeLabel="Cancel payment"
        onClose={() => {
          setPaying(null);
          pay.abandonForm().then(() => setReloads((n) => n + 1));
        }}
        onDone={(outcome) => {
          pay.closeForm();
          setPaying(null);
          if (!paying) return;
          // The form only reports once Stripe took the payment; a backend that still asks for it isn't done yet.
          const settled: CheckoutOutcome =
            outcome.kind === "needs-form" ? { kind: "pending", checkout: outcome.checkout } : outcome;
          finish(settled, paying.name, paying.body);
        }}
      />
    </section>
  );
}
