import { cn } from "@/utils/cn";
import StatusPill from "@/components/common/status-pill";
import type { Tier } from "@/components/sponsor/data";

const TIER_COLORS: Record<Tier, string> = {
  PLATINUM: "bg-[#e4e8ee]",
  GOLD: "bg-[#e8c26a]",
  SILVER: "bg-[#9aa3ae]",
  BRONZE: "bg-[#b8774f]",
};

interface TierBadgeProps {
  tier: Tier;
  // "sm": table rows. "md": package cards.
  size?: "sm" | "md";
}

// A sponsorship package's tier on its metal color.
export default function TierBadge({ tier, size = "sm" }: TierBadgeProps) {
  const sm = size === "sm";
  return (
    <StatusPill
      label={tier}
      color={TIER_COLORS[tier]}
      className={cn("h-auto", sm ? "px-[9px] py-1" : "px-[10px] py-[5px]")}
      textClassName={cn("font-bold text-[#111]", sm ? "text-[11px] tracking-[1.2px]" : "text-xs tracking-[1.4px]")}
    />
  );
}
