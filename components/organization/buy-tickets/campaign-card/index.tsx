"use client";

import { ExternalLink, Pencil, Ticket } from "lucide-react";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import StatusPill from "@/components/common/status-pill";
import { formatMoney } from "@/utils/helper";
import type { TicketCampaign, TicketCampaignStatus } from "@/utils/types/tickets";

const STATUS: Record<TicketCampaignStatus, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "bg-success" },
  INACTIVE: { label: "Inactive", color: "bg-white/30" },
  ENDED: { label: "Ended", color: "bg-white/30" },
};

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

interface CampaignCardProps {
  campaigns: TicketCampaign[];
  loading: boolean;
  // The school's GoFan page; null when none is set.
  ticketLink: string | null;
  onEdit: (campaign: TicketCampaign) => void;
}

// Campaign section: every ticket campaign with its status, its ticket types (price and stock per
// game), its games and its sales, each with its own Edit.
export default function CampaignCard({ campaigns, loading, ticketLink, onEdit }: CampaignCardProps) {
  return (
    <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px] bg-surface-07">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <span
            className="size-16 shrink-0 rounded-full flex items-center justify-center"
            style={{ background: "var(--gradient-cta)" }}
          >
            <Ticket className="size-8 text-white -rotate-45" strokeWidth={1.75} />
          </span>
          <h3 className="font-display font-black text-[28px] uppercase text-white leading-tight">
            {`Ticket Campaigns${campaigns.length ? ` (${campaigns.length})` : ""}`}
          </h3>
        </div>

        {ticketLink && (
          <a
            href={ticketLink}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start lg:self-auto inline-flex items-center gap-2 h-12 px-4 rounded-[8px] text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            <ExternalLink className="size-5" />
            Open Ticket Page
          </a>
        )}
      </div>

      <div className="h-px bg-border-divider" />

      {loading ? (
        <Loader className="mx-auto my-6" />
      ) : campaigns.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/60">
          No campaigns yet. Click <span className="font-semibold text-white">Create Campaign</span> to add one.
        </p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {campaigns.map((c) => {
            const types = [...c.ticketTypes].sort((a, b) => a.sortOrder - b.sortOrder);
            return (
              <div key={c.id} className="rounded-[8px] p-4 flex flex-col gap-4 bg-white/5 border border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-2 min-w-0">
                    <span className="text-lg font-semibold text-white break-words">{c.title}</span>
                    <StatusPill label={STATUS[c.status].label} color={STATUS[c.status].color} className="self-start" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    label="Edit"
                    icon={<Pencil className="size-4" />}
                    onClick={() => onEdit(c)}
                    aria-label={`Edit ${c.title}`}
                    className="shrink-0 h-9 rounded-[8px] text-sm"
                  />
                </div>

                <ul className="flex flex-col divide-y divide-white/10 rounded-[8px] bg-black/30">
                  {types.map((t) => (
                    <li key={t.id} className="flex items-start justify-between gap-3 px-3 py-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-white break-words">{t.title}</span>
                        {t.description && <span className="text-xs text-white/50 break-words">{t.description}</span>}
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-sm font-semibold text-white">{formatMoney(t.price)}</span>
                        <span className="text-[11px] text-white/50">{`${t.quantityPerGame.toLocaleString("en-US")} per game`}</span>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-white bg-black/40 px-3 py-1 rounded-full">
                    {plural(c.gamesCount, "game", "games")}
                  </span>
                  <span className="text-xs text-white/70">
                    {`${plural(c.sales.ticketsSold, "ticket", "tickets")} sold · ${formatMoney(c.sales.grossSales)} · ${c.sales.ticketsScanned.toLocaleString("en-US")} scanned`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
