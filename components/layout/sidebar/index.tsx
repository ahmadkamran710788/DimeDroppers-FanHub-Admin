"use client";

import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import { useSetup } from "@/context/setup";
import { useAuth } from "@/context/auth";
import { ClipboardList, Gem, LayoutDashboard, ShoppingBag, Sparkles, Star, User, Video } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";
import { usePathname } from "next/navigation";

// Setup Wizard is not in the sidebar: first-time setup is a full-screen flow after
// sign-in, and afterwards the organization is edited from Profile.
// Icons are SVG paths, or a lucide icon where the set has no matching SVG.
interface NavLink {
  icon: string | ReactNode;
  label: string;
  href: string;
}

// The sidebar, grouped into titled sections.
const NAV_SECTIONS: { title: string; items: NavLink[] }[] = [
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
      { icon: "/icons/icon-bolt.svg", label: "Activations", href: routes.ui.activations },
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

function NavItem({
  icon,
  label,
  href,
  active,
}: {
  icon: string | ReactNode;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2 pl-[12px] pr-4 py-3 rounded-[8px] text-base font-medium text-white transition-all",
        !active && "text-white/60 hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
      )}
      style={active ? { background: "var(--gradient-cta)" } : undefined}
    >
      {typeof icon === "string" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={icon}
          alt=""
          width={24}
          height={24}
          className={cn("shrink-0 transition-opacity", !active && "opacity-60 group-hover:opacity-100")}
        />
      ) : (
        <span className="size-6 shrink-0 flex items-center justify-center">{icon}</span>
      )}
      <span className="leading-tight">{label}</span>
    </Link>
  );
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { savedSchool } = useSetup();
  const { org } = useAuth();

  const sidebarContent = (
    <aside
      className={cn(
        "flex flex-col w-[256px] shrink-0 h-screen overflow-y-auto",
        "bg-[rgba(11,28,45,0.01)] backdrop-blur-[48px]",
        "shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.2)]"
      )}
    >
      {/* Logo */}
      <div className="h-[104px] flex items-start pt-[27px] px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/DDLogo.svg" alt="Dime Dropper" width={162} height={32} className="shrink-0" />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 flex flex-col gap-5 px-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="flex flex-col gap-1">
            <span className="px-3 pb-1 text-sm font-bold uppercase tracking-wider text-white">{section.title}</span>
            {section.items.map((item) => (
              <NavItem
                key={item.label}
                {...item}
                active={item.href !== "#" && pathname.startsWith(item.href)}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Profile */}
      <div className="px-4 py-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-white/10"
            style={{ border: "2px solid rgba(255,255,255,0.5)", backdropFilter: "blur(24px)" }}
          >
            <User className="w-6 h-6 text-white/60" aria-hidden />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-base font-medium text-white leading-tight">{savedSchool?.name ?? org?.name ?? "Organization"}</span>
            <span className="text-xs font-medium text-white/60">Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: always visible inline */}
      <div className="hidden lg:flex">
        {sidebarContent}
      </div>

      {/* Mobile: overlay drawer */}
      <div className="lg:hidden">
        {/* Backdrop */}
        {open && (
          <div
            className="fixed inset-0 z-30 bg-black/50"
            onClick={onClose}
          />
        )}
        {/* Drawer */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 transform transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
