"use client";

import Image from "next/image";
import { routes } from "@/utils/routes";
import SidebarFrame, { type NavSection } from "@/components/layout/sidebar-frame";
import { SPONSOR_PROFILE } from "@/components/sponsor/data";
import { useSponsorAccount } from "@/components/sponsor/use-sponsor-account";
import { Heart, Image as ImageIcon, Search, Sparkles } from "lucide-react";

// Pages without a route yet link to "#".
const NAV_SECTIONS: NavSection[] = [
  {
    title: "Brand",
    items: [
      { icon: <ImageIcon className="size-6" strokeWidth={1.5} />, label: "Brand Assets", href: routes.ui.sponsor.brandAssets },
      { icon: "/icons/icon-user.svg", label: "Sponsor Profile", href: "#" },
    ],
  },
  {
    title: "Sponsorship",
    items: [
      { icon: <Search className="size-6" strokeWidth={1.5} />, label: "Find Organizations", href: routes.ui.sponsor.findOrganizations },
      { icon: <Heart className="size-6" strokeWidth={1.5} />, label: "Fundable Needs", href: routes.ui.sponsor.fundableNeeds },
      { icon: "/icons/icon-calendar.svg", label: "My Sponsorships", href: "#" },
    ],
  },
];

// Campaign Planner is for national accounts only.
const DIME_AI_SECTION: NavSection = {
  title: "Dime AI",
  items: [{ icon: <Sparkles className="size-6" strokeWidth={1.5} />, label: "Campaign Planner", href: routes.ui.sponsor.campaignPlanner, badge: "NATIONAL" }],
};

interface SponsorSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function SponsorSidebar({ open, onClose }: SponsorSidebarProps) {
  const account = useSponsorAccount();
  return (
    <SidebarFrame
      logo={
        // One line in the admin logo's 162×32 box: the mark at the box height, the wordmark beside it.
        <div className="w-[162px] h-8 flex items-center gap-2 whitespace-nowrap">
          <Image src="/DSLogoMark.svg" alt="" width={32} height={32} className="shrink-0" />
          <span className="font-display font-black italic text-[19px] leading-none text-white">DIME SPONSORS</span>
        </div>
      }
      sections={SPONSOR_PROFILE.nationalAccount ? [...NAV_SECTIONS, DIME_AI_SECTION] : NAV_SECTIONS}
      profileName={account?.displayName ?? "Sponsor"}
      profileRole="Sponsor"
      open={open}
      onClose={onClose}
    />
  );
}
