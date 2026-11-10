"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import PageHeading from "@/components/common/page-heading";
import CardBalance from "@/components/organization/virtual-cards/card-balance";
import CardFace from "@/components/organization/virtual-cards/card-face";
import CardList from "@/components/organization/virtual-cards/card-list";
import SpendingControls from "@/components/organization/virtual-cards/spending-controls";
import Transactions from "@/components/organization/virtual-cards/transactions";
import { CARDS_PAGE_SIZE } from "@/components/organization/fundable-needs/data";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { useAuth } from "@/context/auth";
import { routes } from "@/utils/routes";
import type { OrgCardListItem, OrgNeedListItem, Paged } from "@/utils/types/needs";

interface Loaded {
  key: string;
  view?: Paged<OrgCardListItem>;
  error?: string;
}

interface VirtualCardsProps {
  // The card to open on (from a need's "Virtual card" link); the first card otherwise.
  initialCardId?: string;
}

// Virtual Cards (GET /fanhub/org/needs/cards): one Stripe card per kind of need, reused need after need. Its
// balance and controls follow the need it serves now, and its purchases come from that need.
export default function VirtualCards({ initialCardId }: VirtualCardsProps) {
  const router = useRouter();
  const { org } = useAuth();
  const [page, setPage] = useState(1);
  // Bumped to load again (Try again, or a freeze that hit a 409).
  const [reloads, setReloads] = useState(0);
  const [list, setList] = useState<Loaded | null>(null);
  const [selectedId, setSelectedId] = useState(initialCardId);
  // The full card details are shown only on request, and hidden again when another card is picked.
  const [revealed, setRevealed] = useState(false);
  const [freezing, setFreezing] = useState(false);

  const key = `${page}|${reloads}`;
  useEffect(() => {
    let cancelled = false;
    sponsorRequest<Paged<OrgCardListItem>>("GET", routes.api.orgNeedCards, {
      params: { page, limit: CARDS_PAGE_SIZE },
    }).then((r) => {
      if (!cancelled) setList({ key, view: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [key, page]);

  const current = list?.key === key ? list : null;
  const items = current?.view?.items ?? [];
  const selected = items.find((i) => i.card.id === selectedId) ?? items[0];

  function select(cardId: string) {
    setSelectedId(cardId);
    setRevealed(false);
    // Keeps the card on a refresh or a copied link, without a navigation.
    window.history.replaceState(null, "", routes.ui.virtualCard(cardId));
  }

  async function toggleFreeze() {
    const need = selected?.currentNeed;
    if (!selected || !need || freezing) return;
    const { card } = selected;
    setFreezing(true);
    const r = await sponsorRequest<OrgNeedListItem>(
      "POST",
      card.frozen ? routes.api.orgNeedCardUnfreeze(need.id) : routes.api.orgNeedCardFreeze(need.id)
    );
    setFreezing(false);
    const updated = r.view?.card;
    if (!updated) {
      toast.error(r.message ?? "Couldn't change the card, please try again.");
      // Already frozen / not frozen, or the need has ended: show the card as it is now.
      if (r.status === 409 || r.status === 404) setReloads((n) => n + 1);
      return;
    }
    setList((prev) =>
      prev?.view
        ? {
            ...prev,
            view: { ...prev.view, items: prev.view.items.map((i) => (i.card.id === updated.id ? { ...i, card: updated } : i)) },
          }
        : prev
    );
    if (updated.frozen) setRevealed(false);
    toast.success(
      updated.frozen
        ? `Card •••• ${updated.last4 ?? ""} frozen. New purchases will be declined.`
        : `Card •••• ${updated.last4 ?? ""} is active again.`
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-10">
      <PageHeading
        title="Virtual Cards"
        description="You get one Stripe virtual card for each kind of need, reused for your next need once one ends. Sponsor funding loads onto it, and it only works in the merchant categories allowed for that kind of need."
      />

      {!current ? (
        <Loader className="py-16" />
      ) : current.error ? (
        <section className="flex flex-col items-center gap-3 rounded-[8px] bg-surface-06 px-6 py-12 text-center text-white backdrop-blur-[24px]">
          <p className="text-sm text-white/60">{`Couldn't load your cards: ${current.error}`}</p>
          <Button variant="outline" label="Try again" onClick={() => setReloads((n) => n + 1)} />
        </section>
      ) : !selected ? (
        <section className="flex flex-col items-center gap-3 rounded-[8px] bg-surface-06 px-6 py-12 text-center text-white backdrop-blur-[24px]">
          <h3 className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight">No cards yet</h3>
          <p className="max-w-[420px] text-sm leading-[1.5] text-white/60">
            Your first fundable need of each kind sets up its card.
          </p>
          <Button variant="outline" label="View fundable needs" onClick={() => router.push(routes.ui.fundableNeeds)} />
        </section>
      ) : (
        <div className="flex flex-wrap items-start gap-6">
          <CardList
            items={items}
            total={current.view?.pagination.total ?? items.length}
            selectedId={selected.card.id}
            onSelect={select}
            page={page}
            pageCount={current.view?.pagination.totalPages ?? 0}
            onPage={setPage}
          />
          <section
            aria-label={`Card ending in ${selected.card.last4 ?? "…"}`}
            className="flex min-w-0 flex-[3_1_520px] flex-col gap-6"
          >
            <div className="flex flex-wrap items-stretch gap-6">
              <CardFace
                key={selected.card.id}
                item={selected}
                orgName={org?.name ?? ""}
                revealed={revealed}
                onRevealFailed={() => setRevealed(false)}
              />
              <CardBalance
                item={selected}
                revealed={revealed}
                freezing={freezing}
                onToggleReveal={() => setRevealed((r) => !r)}
                onToggleFreeze={() => void toggleFreeze()}
              />
            </div>
            <SpendingControls item={selected} />
            <Transactions
              key={selected.currentNeed?.id ?? selected.card.id}
              needId={selected.currentNeed?.id ?? null}
              allowedCategories={selected.card.allowedCategories}
            />
          </section>
        </div>
      )}
    </div>
  );
}
