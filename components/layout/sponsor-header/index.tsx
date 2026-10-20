"use client";

import Image from "next/image";
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
            <span className="text-sm font-semibold uppercase truncate max-w-[160px]">{SPONSOR_PROFILE.name}</span>
            <span className="text-xs text-[#a8a8a8] truncate max-w-[160px]">{SPONSOR_PROFILE.email}</span>
          </div>
          <div className="size-12 shrink-0 rounded-full border-2 border-[#444] flex items-center justify-center font-display font-bold text-lg">
            {SPONSOR_PROFILE.initials}
          </div>
        </div>
      </div>
    </header>
  );
}
