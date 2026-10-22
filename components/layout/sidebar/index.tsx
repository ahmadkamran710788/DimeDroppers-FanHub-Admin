"use client";

import { routes } from "@/utils/routes";
import { useSetup } from "@/context/setup";
import Image from "next/image";
import { orgKindOf, useAuth, type OrgKind } from "@/context/auth";
import SidebarFrame, { type NavSection } from "@/components/layout/sidebar-frame";
import { BotMessageSquare, ClipboardList, Gem, GitFork, LayoutDashboard, Layers, MapPin, MessagesSquare, ShoppingBag, Sparkles, Star, Trophy, Video } from "lucide-react";

// Setup Wizard is not in the sidebar: first-time setup is a full-screen flow after
// sign-in, and afterwards the organization is edited from Profile.

// The sidebar, grouped into titled sections.
const NAV_SECTIONS: NavSection[] = [
  {
    title: "Profile",
    items: [{ icon: "/icons/icon-user.svg", label: "Profile", href: routes.ui.profile }],
  },
  {
    title: "Command",
    items: [
      { icon: <LayoutDashboard className="size-6" strokeWidth={1.5} />, label: "Command Center", href: routes.ui.commandCenter },
      { icon: "/icons/icon-calendar.svg", label: "Schedule", href: routes.ui.schedule },
    ],
  },
  {
    title: "Operations",
    items: [
      { icon: "/icons/icon-users.svg", label: "Teams", href: routes.ui.teams },
      { icon: <ClipboardList className="size-6" strokeWidth={1.5} />, label: "Scorekeeper Requests", href: routes.ui.scorekeeperRequests },
      { icon: <Video className="size-6" strokeWidth={1.5} />, label: "Videographer Requests", href: routes.ui.videographerRequests },
      { icon: "/icons/icon-link.svg", label: "External Links", href: routes.ui.externalLinks },
      { icon: <MessagesSquare className="size-6" strokeWidth={1.5} />, label: "Communications", href: routes.ui.communications },
      { icon: <BotMessageSquare className="size-6" strokeWidth={1.5} />, label: "FanHub AI", href: routes.ui.fanhubAi },
    ],
  },
  {
    title: "Game Day",
    items: [
      { icon: "/icons/icon-ticket.svg", label: "Buy Tickets", href: routes.ui.buyTickets },
      { icon: "/icons/icon-media.svg", label: "Media", href: routes.ui.media },
      { icon: <Gem className="size-6" strokeWidth={1.5} />, label: "Digital Collectibles", href: routes.ui.digitalCollectibles },
      { icon: <ShoppingBag className="size-6" strokeWidth={1.5} />, label: "Team Shop", href: routes.ui.teamShop },
    ],
  },
  {
    title: "Fan & Engagement",
    items: [
      { icon: <Sparkles className="size-6" strokeWidth={1.5} />, label: "Engagement", href: routes.ui.engagement },
      { icon: <Star className="size-6" strokeWidth={1.5} />, label: "Recognition & Fan Wall", href: routes.ui.recognition },
      { icon: "/icons/icon-donations.svg", label: "Fundraising", href: routes.ui.fundraising },
    ],
  },
  {
    title: "Business",
    items: [
      { icon: "/icons/icon-business.svg", label: "Sponsors", href: routes.ui.sponsors },
      { icon: "/icons/icon-bolt.svg", label: "Inventory", href: routes.ui.inventory },
    ],
  },
  {
    title: "System",
    items: [
      // Hidden until the Analytics page is built.
      // { icon: "/icons/icon-analytics.svg", label: "Analytics", href: "#" },
      { icon: "/icons/icon-settings.svg", label: "Settings", href: "#" },
      { icon: "/icons/icon-help2.svg", label: "Help Center", href: routes.ui.helpCenter },
    ],
  },
];

// Tournament only: one event's data, under Schedule in the Command section.
const TOURNAMENT_COMMAND_ITEMS: NavSection["items"] = [
  { icon: <Layers className="size-6" strokeWidth={1.5} />, label: "Divisions", href: routes.ui.divisions },
  { icon: <MapPin className="size-6" strokeWidth={1.5} />, label: "Venues", href: routes.ui.venues },
  { icon: <Trophy className="size-6" strokeWidth={1.5} />, label: "Standings", href: routes.ui.standings },
  { icon: <GitFork className="size-6" strokeWidth={1.5} />, label: "Brackets", href: routes.ui.brackets },
];

// The sections for this org: a tournament gets its event pages after Schedule; a school's sidebar is
// unchanged.
const sectionsFor = (isTournament: boolean): NavSection[] =>
  isTournament
    ? NAV_SECTIONS.map((s) => (s.title === "Command" ? { ...s, items: [...s.items, ...TOURNAMENT_COMMAND_ITEMS] } : s))
    : NAV_SECTIONS;

// The logo says which panel this is (162×46: the wordmark plus "SCHOOL" / "TOURNAMENT" under it);
// the plain 162×32 one shows until the org's type is known.
const LOGOS: Record<OrgKind, { src: string; alt: string }> = {
  school: { src: "/DDLogo-school.svg", alt: "Dime Dropper School" },
  tournament: { src: "/DDLogo-tournament.svg", alt: "Dime Dropper Tournament" },
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { savedSchool } = useSetup();
  const { org } = useAuth();
  const kind = orgKindOf(org);
  const logo = kind ? LOGOS[kind] : null;

  return (
    <SidebarFrame
      logo={
        logo ? (
          <Image src={logo.src} alt={logo.alt} width={162} height={46} className="shrink-0" priority />
        ) : (
          <Image src="/DDLogo.svg" alt="Dime Dropper" width={162} height={32} className="shrink-0" priority />
        )
      }
      sections={sectionsFor(kind === "tournament")}
      profileName={savedSchool?.name ?? org?.name ?? "Organization"}
      profileRole="Admin"
      open={open}
      onClose={onClose}
    />
  );
}
