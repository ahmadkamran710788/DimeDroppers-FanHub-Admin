"use client";

import { routes } from "@/utils/routes";
import SidebarFrame, { type NavSection } from "@/components/layout/sidebar-frame";
import { SPONSOR_PROFILE } from "@/components/sponsor/data";
import { Heart, Image as ImageIcon, Search, Sparkles } from "lucide-react";

// Pages without a route yet link to "#".
const NAV_SECTIONS: NavSection[] = [
  {
    title: "Brand",
    items: [
      { icon: <ImageIcon className="size-6" strokeWidth={1.5} />, label: "Brand Assets", href: "#" },
      { icon: "/icons/icon-user.svg", label: "Sponsor Profile", href: "#" },
    ],
  },
  {
    title: "Sponsorship",
    items: [
      { icon: <Search className="size-6" strokeWidth={1.5} />, label: "Find Organizations", href: "#" },
      { icon: <Heart className="size-6" strokeWidth={1.5} />, label: "Fundable Needs", href: routes.ui.sponsor.fundableNeeds },
      { icon: "/icons/icon-calendar.svg", label: "My Sponsorships", href: "#" },
    ],
  },
];

// Campaign Planner is for national accounts only.
const DIME_AI_SECTION: NavSection = {
  title: "Dime AI",
  items: [{ icon: <Sparkles className="size-6" strokeWidth={1.5} />, label: "Campaign Planner", href: "#", badge: "NATIONAL" }],
};

interface SponsorSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function SponsorSidebar({ open, onClose }: SponsorSidebarProps) {
  return (
    <SidebarFrame
      logo={
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/DSLogoMark.svg" alt="" width={40} height={40} className="shrink-0" />
          <span className="font-bebas italic text-[34px] leading-none tracking-[0.5px] text-white">DIME SPONSORS</span>
        </div>
      }
      sections={SPONSOR_PROFILE.nationalAccount ? [...NAV_SECTIONS, DIME_AI_SECTION] : NAV_SECTIONS}
      profileName={SPONSOR_PROFILE.name}
      profileRole="Sponsor"
      open={open}
      onClose={onClose}
    />
  );
}
