"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import PageHeading from "@/components/common/page-heading";
import CardBalance from "@/components/organization/virtual-cards/card-balance";
import CardFace from "@/components/organization/virtual-cards/card-face";
import CardList from "@/components/organization/virtual-cards/card-list";
import SpendingControls from "@/components/organization/virtual-cards/spending-controls";
import Transactions from "@/components/organization/virtual-cards/transactions";
import { useAuth } from "@/context/auth";
import { useFundableNeeds } from "@/context/fundable-needs";
import { routes } from "@/utils/routes";

interface VirtualCardsProps {
  // The need whose card to open on (from a need's "Virtual card" link); the first card otherwise.
  initialCardId?: string;
}

// Virtual Cards: every fundable need's Stripe card, its balance and controls, and its purchases.
export default function VirtualCards({ initialCardId }: VirtualCardsProps) {
  const router = useRouter();
  const { org } = useAuth();
  const { needs, setCardFrozen } = useFundableNeeds();
  const [selectedId, setSelectedId] = useState(initialCardId);
  // The full card details are shown only on request, and hidden again when another card is picked.
  const [revealed, setRevealed] = useState(false);
  const need = needs.find((n) => n.id === selectedId) ?? needs[0];

  function select(needId: string) {
    setSelectedId(needId);
    setRevealed(false);
  }

  function toggleFreeze() {
    if (!need) return;
    const frozen = !need.card.frozen;
    setCardFrozen(need.id, frozen);
    toast.success(
      frozen
        ? `Card •••• ${need.card.last4} frozen. New purchases will be declined.`
        : `Card •••• ${need.card.last4} is active again.`
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-10">
      <PageHeading
        title="Virtual Cards"
        description="Every fundable need has its own Stripe virtual card. Sponsor funding loads onto that card, and it only works in the merchant categories allowed for its need."
      />

      {!need ? (
        <section className="flex flex-col items-center gap-3 rounded-[8px] bg-surface-06 px-6 py-12 text-center text-white backdrop-blur-[24px]">
          <h3 className="font-display font-black text-xl lg:text-[28px] uppercase leading-tight">No cards yet</h3>
          <p className="max-w-[420px] text-sm leading-[1.5] text-white/60">Each fundable need you create gets its own card.</p>
          <Button variant="outline" label="View fundable needs" onClick={() => router.push(routes.ui.fundableNeeds)} />
        </section>
      ) : (
        <div className="flex flex-wrap items-start gap-6">
          <CardList needs={needs} selectedId={need.id} onSelect={select} />
          <section aria-label={`Card ending in ${need.card.last4}`} className="flex min-w-0 flex-[3_1_520px] flex-col gap-6">
            <div className="flex flex-wrap items-stretch gap-6">
              <CardFace need={need} orgName={org?.name ?? ""} revealed={revealed} />
              <CardBalance
                need={need}
                revealed={revealed}
                onToggleReveal={() => setRevealed((r) => !r)}
                onToggleFreeze={toggleFreeze}
              />
            </div>
            <SpendingControls need={need} />
            <Transactions card={need.card} />
          </section>
        </div>
      )}
    </div>
  );
}
