"use client";

import { Menu } from "lucide-react";
import Button from "@/components/common/button";
import { SPONSOR_PROFILE } from "@/components/sponsor/data";

interface SponsorHeaderProps {
  title: string;
  onMenuClick: () => void;
}

// Header for the sponsor pages: section title, messages and notifications, and the sponsor's
// name, email and initials. Messages and notifications are not wired up yet.
export default function SponsorHeader({ title, onMenuClick }: SponsorHeaderProps) {
  return (
    <header className="flex flex-wrap gap-4 items-center justify-between px-4 lg:px-14 py-[22px] border-b border-[#1c1c1c] shrink-0">
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          icon={<Menu className="w-6 h-6" />}
          aria-label="Open menu"
          onClick={onMenuClick}
          className="lg:hidden size-8 bg-transparent backdrop-blur-none"
        />
        <div className="font-bebas text-[36px] tracking-[0.5px] uppercase">{title}</div>
      </div>
      <div className="flex items-center gap-[18px]">
        <Button
          size="icon"
          // eslint-disable-next-line @next/next/no-img-element
          icon={<img src="/icons/icon-sponsor-messages.svg" alt="" width={26} height={26} />}
          aria-label="Messages"
          className="size-11 rounded-none bg-transparent backdrop-blur-none"
        />
        <Button
          size="icon"
          // eslint-disable-next-line @next/next/no-img-element
          icon={<img src="/icons/icon-sponsor-bell.svg" alt="" width={26} height={26} />}
          aria-label="Notifications"
          className="relative size-11 rounded-none bg-transparent backdrop-blur-none"
        >
          <span className="absolute top-[9px] right-[10px] size-2 rounded-full bg-[#ff4d4d]" />
        </Button>
        <div className="hidden sm:block text-right leading-[1.3]">
          <div className="font-semibold text-[17px] uppercase">{SPONSOR_PROFILE.name}</div>
          <div className="text-[#a8a8a8] text-[14px]">{SPONSOR_PROFILE.email}</div>
        </div>
        <div className="box-content size-14 rounded-full border-2 border-[#444] flex items-center justify-center font-bebas text-[24px]">
          {SPONSOR_PROFILE.initials}
        </div>
      </div>
    </header>
  );
}
