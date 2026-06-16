"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import { clearFanhubSession } from "@/utils/auth/session";
import { useAuth } from "@/context/auth";

interface HeaderProps {
  className?: string;
  title?: string;
  onMenuClick?: () => void;
}

export default function Header({ className, title = "Setup Wizard", onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { org, clearAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  // Recalculate position whenever the dropdown opens
  useEffect(() => {
    if (!open || !avatarRef.current) return;
    const rect = avatarRef.current.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  }, [open]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        avatarRef.current && !avatarRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    clearFanhubSession();
    clearAuth();
    await fetch(routes.api.proxyAuthSignout, { method: "POST" });
    router.replace(routes.ui.signIn);
  }

  const dropdown = open
    ? createPortal(
        <div
          ref={dropdownRef}
          role="menu"
          className="fixed min-w-[160px] rounded-[8px] py-1"
          style={{
            top: dropdownStyle.top,
            right: dropdownStyle.right,
            zIndex: 9999,
            background: "rgba(11,28,45,0.92)",
            backdropFilter: "blur(48px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-150"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign out
          </button>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <header
        className={cn(
          "h-20 flex items-center justify-between px-4 lg:px-10 shrink-0",
          "bg-[rgba(11,28,45,0.01)] backdrop-blur-[48px]",
          "shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.2)]",
          className
        )}
      >
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-white"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          <h1 className="font-display font-black text-xl lg:text-[28px] uppercase text-white tracking-wide">
            {title}
          </h1>
        </div>

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

          {/* Org info + avatar toggle */}
          <div className="flex items-center gap-3">
            {org && (
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-sm font-semibold text-white truncate max-w-[160px]">{org.name}</span>
                <span className="text-xs text-white/50 truncate max-w-[160px]">{org.email}</span>
              </div>
            )}
            <button
              ref={avatarRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="w-12 h-12 rounded-full overflow-hidden shrink-0 focus:outline-none flex items-center justify-center bg-white/10 text-white font-bold text-sm uppercase"
              style={{ border: "2px solid rgba(255,255,255,0.5)", backdropFilter: "blur(24px)" }}
            >
              {org?.name ? org.name.charAt(0) : "?"}
            </button>
          </div>
        </div>
      </header>

      {dropdown}
    </>
  );
}
