import type { Campaign } from "@/utils/types/campaign";

export type CampaignStatusLabel = "Draft" | "Active" | "Ended" | "Cancelled";

// An ACTIVE campaign past its end date stays ACTIVE until a donation closes it; the panel shows it as ended.
export const campaignStatusLabel = (c: Campaign): CampaignStatusLabel =>
  c.status === "DRAFT"
    ? "Draft"
    : c.status === "CANCELLED"
      ? "Cancelled"
      : c.status === "ENDED" || c.isEnded
        ? "Ended"
        : "Active";

export const CAMPAIGN_STATUS_COLOR: Record<CampaignStatusLabel, string> = {
  Active: "bg-success",
  Draft: "bg-steel-blue",
  Ended: "bg-white/30",
  Cancelled: "bg-error/70",
};

// Game-day donation drives belong to the live scorekeeper flow, and cancelled campaigns are
// history only; neither is edited from the panel.
export const isCampaignEditable = (c: Campaign) => !c.scheduleEventId && c.status !== "CANCELLED";
