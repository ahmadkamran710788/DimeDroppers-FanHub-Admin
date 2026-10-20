"use client";

import { cn } from "@/utils/cn";
import { User } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";
import { usePathname } from "next/navigation";

// The sidebar every role shares: logo, titled nav sections and the profile footer, inline on
// desktop and a drawer on mobile. Each role passes its own logo and sections.
// Icons are SVG paths, or a lucide icon where the set has no matching SVG.
export interface NavLink {
  icon: string | ReactNode;
  label: string;
  href: string;
  // Small pill after the label, e.g. "NATIONAL".
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavLink[];
}

function NavItem({ icon, label, href, badge, active }: NavLink & { active?: boolean }) {
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
      {badge && (
        <span className="ml-auto text-[11px] font-bold tracking-[1px] leading-normal px-[7px] py-[3px] rounded-full bg-[#2a2148] text-[#d9ccff] border border-[#4a3f7a]">
          {badge}
        </span>
      )}
    </Link>
  );
}

interface SidebarFrameProps {
  logo: ReactNode;
  sections: NavSection[];
  profileName: string;
  profileRole: string;
  open: boolean;
  onClose: () => void;
}

export default function SidebarFrame({ logo, sections, profileName, profileRole, open, onClose }: SidebarFrameProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <aside
      className={cn(
        "flex flex-col w-[256px] shrink-0 h-screen overflow-y-auto",
        "bg-[rgba(11,28,45,0.01)] backdrop-blur-[48px]",
        "shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.2)]"
      )}
    >
      {/* Logo */}
      <div className="h-[104px] flex items-start pt-[27px] px-6">{logo}</div>

      {/* Nav */}
      <nav className="flex-1 py-2 flex flex-col gap-5 px-4">
        {sections.map((section) => (
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
            <span className="text-base font-medium text-white leading-tight">{profileName}</span>
            <span className="text-xs font-medium text-white/60">{profileRole}</span>
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
