"use client";

import { cn } from "@/utils/cn";

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        "h-20 flex items-center justify-between px-10 shrink-0",
        "bg-[rgba(11,28,45,0.01)] backdrop-blur-[48px]",
        "shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.2)]",
        className
      )}
    >
      <h1 className="font-display font-black text-[28px] uppercase text-white tracking-wide">
        Setup Wizard
      </h1>

      {/* Right side: help, bell, avatar */}
      <div className="flex items-center gap-6">
        <button type="button" className="w-6 h-6 flex items-center justify-center" aria-label="Help">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-help.svg" alt="" width={24} height={24} />
        </button>
        <button type="button" className="w-6 h-6 flex items-center justify-center relative" aria-label="Notifications">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-bell.svg" alt="" width={24} height={24} />
        </button>
        {/* Avatar — photo only, no text */}
        <div
          className="w-12 h-12 rounded-full overflow-hidden shrink-0"
          style={{ border: "2px solid rgba(255,255,255,0.5)", backdropFilter: "blur(24px)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/avatar-photo.png"
            alt="Profile"
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
