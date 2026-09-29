"use client";

import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import { useSetup } from "@/context/setup";
import { useAuth } from "@/context/auth";
import { User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Setup Wizard is not in the sidebar: first-time setup is a full-screen flow after
// sign-in, and afterwards the organization is edited from Profile.
const NAV_ITEMS = [
  { icon: "/icons/icon-user.svg", label: "Profile", href: routes.ui.profile },
  { icon: "/icons/icon-calendar.svg", label: "Schedule", href: routes.ui.schedule },
  { icon: "/icons/icon-link.svg", label: "External Links", href: routes.ui.externalLinks },
  { icon: "/icons/icon-bolt.svg", label: "Activations", href: routes.ui.activations },
  { icon: "/icons/icon-users.svg", label: "Teams", href: routes.ui.teams },
  { icon: "/icons/icon-ticket.svg", label: "Buy Tickets", href: routes.ui.buyTickets },
  { icon: "/icons/icon-media.svg", label: "Media", href: "#" },
  { icon: "/icons/icon-business.svg", label: "Sponsors", href: "#" },
  { icon: "/icons/icon-donations.svg", label: "Donations", href: "#" },
  { icon: "/icons/icon-analytics.svg", label: "Analytics", href: "#" },
  { icon: "/icons/icon-settings.svg", label: "Settings", href: "#" },
];

function NavItem({
  icon,
  label,
  href,
  active,
}: {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 pl-[12px] pr-4 py-4 rounded-[8px] text-base font-medium text-white transition-all",
        !active && "text-white/80 hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
      )}
      style={active ? { background: "var(--gradient-cta)" } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" width={24} height={24} className="shrink-0" />
      {label}
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
        "flex flex-col w-[236px] shrink-0 h-screen overflow-y-auto",
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
      <nav className="flex-1 py-2 flex flex-col px-4">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.label}
            {...item}
            active={item.href !== "#" && pathname.startsWith(item.href)}
          />
        ))}

        {/* Help Center */}
        <NavItem icon="/icons/icon-help2.svg" label="Help Center" href="#" />
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
