import { ExternalLink, Ticket } from "lucide-react";
import Button from "@/components/common/button";
import StatusPill from "@/components/common/status-pill";
import type { CampaignTier } from "@/components/buy-tickets/create-campaign-modal";
import { CAMPAIGN_STATUS_COLOR, type TicketCampaign } from "@/components/buy-tickets/data";

interface CampaignCardProps {
  campaign: TicketCampaign;
  // Ticket purchase URL (the saved GoFan link); null when none is set yet.
  ticketUrl: string | null;
  // Campaigns created through the Create Campaign dialog, newest last.
  tiers: CampaignTier[];
  onEdit: () => void;
}

const fmtAmount = (amount: string) =>
  Number(amount).toLocaleString("en-US", { style: "currency", currency: "USD" });

// Campaign section: header (name, status, actions) and every created campaign's details.
export default function CampaignCard({ campaign, ticketUrl, tiers, onEdit }: CampaignCardProps) {
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
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <h3 className="font-display font-black text-[28px] uppercase text-white leading-tight">
              {campaign.name}
            </h3>
            <StatusPill label={campaign.status} color={CAMPAIGN_STATUS_COLOR[campaign.status]} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          {ticketUrl && (
            <a
              href={ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-12 px-4 rounded-[8px] text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="size-5" />
              Open {campaign.provider}
            </a>
          )}
          <Button variant="ghost" label="Edit Campaign" onClick={onEdit} />
        </div>
      </div>

      <div className="h-px bg-border-divider" />

      {tiers.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/60">
          No campaigns yet. Click <span className="font-semibold text-white">Create Campaign</span> to add one.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <div key={tier.key} className="rounded-[8px] p-4 flex flex-col gap-3 bg-white/5 border border-white/10">
              <div className="flex items-start justify-between gap-3">
                <span className="text-base font-semibold text-white break-words min-w-0">{tier.title}</span>
                <span className="font-display font-black text-2xl text-white leading-none shrink-0">
                  {fmtAmount(tier.amount)}
                </span>
              </div>
              {tier.description && <p className="text-sm text-white/60 break-words">{tier.description}</p>}
              <span className="self-start text-xs font-medium text-white bg-black/40 px-3 py-1 rounded-full">
                {tier.tickets} {tier.tickets === 1 ? "ticket" : "tickets"} available
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
