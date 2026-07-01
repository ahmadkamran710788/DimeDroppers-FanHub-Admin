"use client";

import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import { useSetup } from "@/context/setup";
import { useAuth } from "@/context/auth";
import { getResumeStep } from "@/utils/fanhub/getResumeStep";
import { User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_MAIN = [
  { icon: "/icons/icon-home.svg", label: "Home", href: "/", padding: "pl-[12px]" },
];

const NAV_BOTTOM = [
  { icon: "/icons/icon-calendar.svg", label: "Schedule", href: routes.ui.schedule },
  { icon: "/icons/icon-bolt.svg", label: "Activations", href: "#" },
  { icon: "/icons/icon-users.svg", label: "Teams", href: "#" },
  { icon: "/icons/icon-media.svg", label: "Media", href: "#" },
  { icon: "/icons/icon-business.svg", label: "Sponsors", href: "#" },
  { icon: "/icons/icon-donations.svg", label: "Donations", href: "#" },
  { icon: "/icons/icon-analytics.svg", label: "Analytics", href: "#" },
  { icon: "/icons/icon-settings.svg", label: "Settings", href: "#" },
];

// Display-only: the wizard steps are NOT navigable from the sidebar. Forward/back
// is driven solely by the bottom WizardFooter (Back / Next) so each step's
// validation and save run in order. The list here only renders progress.
const WIZARD_STEPS = [
  { number: 1, label: "Organization Details" },
  { number: 2, label: "Import Schedule" },
  { number: 3, label: "Choose Activations" },
  { number: 4, label: "Review & Publish" },
];

function urlToStepNumber(url: string): number {
  if (url.includes("organization-details")) return 1;
  if (url.includes("import-schedule")) return 2;
  if (url.includes("choose-activations")) return 3;
  if (url.includes("review-publish")) return 4;
  return 1;
}

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
        active ? "bg-[rgba(255,255,255,0.08)]" : "text-white/80 hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
      )}
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
  const activeStep = pathname.includes("setup-wizard")
    ? urlToStepNumber(pathname)
    : urlToStepNumber(getResumeStep(savedSchool));

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
        {/* Home */}
        {NAV_MAIN.map((item) => (
          <NavItem key={item.label} {...item} active={pathname === item.href} />
        ))}

        {/* Setup Wizard CTA */}
        <Link
          href={getResumeStep(savedSchool)}
          className="flex items-center gap-2 pl-[12px] pr-4 py-4 rounded-[8px] text-base font-medium text-white"
          style={{ background: "var(--gradient-cta)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-wand-stars.svg" alt="" width={24} height={24} className="shrink-0" />
          Setup Wizard
        </Link>

        {/* Wizard step sub-items — display-only progress, not clickable. Navigation
            between steps happens through the bottom WizardFooter (Back / Next). */}
        {WIZARD_STEPS.map((step) => {
          const isActive = step.number === activeStep;
          const isCompleted = step.number < activeStep;
          return (
            <div
              key={step.number}
              className="flex items-center gap-3 pl-6 pr-2 py-4 rounded-[8px] transition-all"
            >
              {/* 24px step circle */}
              <div className="relative shrink-0 flex items-center justify-center">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white relative z-10",
                    (isActive || isCompleted) ? "bg-steel-blue" : "bg-[rgba(255,255,255,0.2)]"
                  )}
                >
                  {step.number}
                </div>
              </div>
              <span
                className={cn(
                  "text-sm font-medium leading-tight transition-colors whitespace-nowrap",
                  isActive ? "text-white" : "text-white/60"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}

        {/* Main nav items */}
        {NAV_BOTTOM.map((item) => (
          <NavItem key={item.label} {...item} active={pathname === item.href} />
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
