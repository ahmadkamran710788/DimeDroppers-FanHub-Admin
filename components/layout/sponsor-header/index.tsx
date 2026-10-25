"use client";

import Image from "next/image";
import { Menu } from "lucide-react";
import Button from "@/components/common/button";
import RowActionsMenu from "@/components/common/row-actions-menu";
import { useSponsorAccount } from "@/components/sponsor/use-sponsor-account";
import { clearFanhubSession } from "@/utils/auth/session";
import { routes } from "@/utils/routes";

interface SponsorHeaderProps {
  title: string;
  onMenuClick: () => void;
}

// Header for the sponsor pages: section title, messages and notifications, and the sponsor's
// name, email and initials. Messages and notifications are not wired up yet.
export default function SponsorHeader({ title, onMenuClick }: SponsorHeaderProps) {
  const account = useSponsorAccount();

  async function signOut() {
    clearFanhubSession();
    await fetch(routes.api.proxyAuthSignout, { method: "POST" });
    // Full-page navigation so nothing of the sponsor session stays in memory.
    window.location.replace(routes.ui.signIn);
  }

  return (
    // Sized like the admin header: 80px tall, 40px side padding, 28px title, 24px icons, 48px avatar.
    <header className="h-20 flex gap-4 items-center justify-between px-4 lg:px-10 border-b border-[#1c1c1c] shrink-0">
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          icon={<Menu className="w-6 h-6" />}
          aria-label="Open menu"
          onClick={onMenuClick}
          className="lg:hidden size-8 bg-transparent backdrop-blur-none"
        />
        <h1 className="font-display font-black text-xl lg:text-[28px] uppercase tracking-wide">{title}</h1>
      </div>
      <div className="flex items-center gap-6">
        <Button
          size="icon"
          icon={<Image src="/icons/icon-sponsor-messages.svg" alt="" width={24} height={24} />}
          aria-label="Messages"
          className="size-6 rounded-none bg-transparent backdrop-blur-none"
        />
        <Button
          size="icon"
          icon={<Image src="/icons/icon-sponsor-bell.svg" alt="" width={24} height={24} />}
          aria-label="Notifications"
          className="relative size-6 rounded-none bg-transparent backdrop-blur-none"
        >
          <span className="absolute top-0 right-0 size-2 rounded-full bg-[#ff4d4d]" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm font-semibold uppercase truncate max-w-[160px]">{account?.displayName ?? "Sponsor"}</span>
            {/* The brand once /me has answered ("No brand yet" without one), the email before. */}
            <span className="text-xs text-[#a8a8a8] truncate max-w-[160px]">
              {account?.brandName ?? (account && "brand" in account ? "No brand yet" : (account?.email ?? ""))}
            </span>
          </div>
          {/* The avatar opens the account menu (Sign out). */}
          <RowActionsMenu
            ariaLabel="Account menu"
            className="size-12 p-0 shrink-0 rounded-full outline-0 border-2 border-[#444] bg-transparent font-display font-bold text-lg"
            trigger={account?.initials ?? "S"}
            items={[{ label: "Sign out", onSelect: signOut, variant: "destructive" }]}
          />
        </div>
      </div>
    </header>
  );
}
